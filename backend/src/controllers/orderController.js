import Order from "../models/Order.js";
import Product from "../models/Product.js";

// Tạo đơn hàng mới
export const createOrder = async (req, res) => {
  try {
    // Debug: Log userId từ middleware
    console.log("🔍 Creating order - userId:", req.userId);
    console.log("🔍 Authorization header:", req.headers.authorization);
    
    const {
      customer,
      items,
      payment_method = "cod",
      notes = "",
      total_amount,
      voucher_code,
      voucher_id,
      discount_amount = 0
    } = req.body;

    // Validation
    if (!customer || !customer.name || !customer.email || !customer.phone || !customer.address) {
      return res.status(400).json({
        success: false,
        message: "Thông tin khách hàng không đầy đủ"
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Giỏ hàng trống"
      });
    }

    // Kiểm tra sản phẩm có tồn tại không và stock
    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm với ID ${item.product_id} không tồn tại`
        });
      }

      // Kiểm tra stock của variation nếu có
      console.log(`🔍 Checking stock for product ${product.name}, item variation:`, item.variation);
      
      if (item.variation && item.variation.color) {
        const variationItem = product.variations?.find(
          v => {
            const colorMatch = v.color === item.variation.color;
            const sizeMatch = !item.variation.size || v.size === item.variation.size;
            const ramMatch = !item.variation.ram || v.ram === item.variation.ram;
            return colorMatch && sizeMatch && ramMatch;
          }
        );
        
        console.log(`🔍 Found variation item:`, variationItem);
        console.log(`🔍 Product variations:`, product.variations);
        
        if (!variationItem) {
          const parts = [item.variation.color];
          if (item.variation.size) parts.push(item.variation.size);
          if (item.variation.ram) parts.push(`${item.variation.ram} RAM`);
          const variationDesc = parts.join(" - ");
          return res.status(400).json({
            success: false,
            message: `Không tìm thấy biến thể "${variationDesc}" cho sản phẩm ${product.name}`
          });
        }
        
        if (variationItem.stock < item.quantity) {
          const parts = [item.variation.color];
          if (item.variation.size) parts.push(item.variation.size);
          if (item.variation.ram) parts.push(`${item.variation.ram} RAM`);
          const variationDesc = parts.join(" - ");
          return res.status(400).json({
            success: false,
            message: `Sản phẩm ${product.name} ("${variationDesc}") không đủ số lượng tồn kho (còn ${variationItem.stock} sản phẩm)`
          });
        }
      } else {
        // Kiểm tra số lượng tồn kho tổng
        if (product.in_stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Sản phẩm ${product.name} không đủ số lượng tồn kho`
          });
        }
      }
    }

    // Tạo order number
    const count = await Order.countDocuments();
    const order_number = `ORD${String(count + 1).padStart(6, '0')}`;

    // Tạo đơn hàng
    console.log("📝 Creating order with user_id:", req.userId);
    const order = new Order({
      user_id: req.userId || null, // null nếu là khách vãng lai
      order_number,
      customer,
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        variation: item.variation || {}
      })),
      payment_method,
      notes,
      total_amount,
      voucher_id: voucher_id || null,
      voucher_code: voucher_code || null,
      discount_amount: discount_amount || 0
    });

    await order.save();
    console.log("💾 Order saved with user_id:", order.user_id);

    // Cập nhật số lượng tồn kho
    console.log("📦 Starting stock update process...");
    for (const item of items) {
      console.log(`📦 Processing item:`, {
        product_id: item.product_id,
        quantity: item.quantity,
        variation: item.variation
      });
      
      const product = await Product.findById(item.product_id);
      
      if (!product) {
        console.error(`❌ Product not found: ${item.product_id}`);
        continue;
      }
      
      console.log(`📦 Product before update:`, {
        name: product.name,
        in_stock: product.in_stock,
        variations: product.variations
      });
      
      if (item.variation && item.variation.color) {
        // Cập nhật stock của variation
        const variationIndex = product.variations?.findIndex(
          v => {
            const colorMatch = v.color === item.variation.color;
            const sizeMatch = !item.variation.size || v.size === item.variation.size;
            const ramMatch = !item.variation.ram || v.ram === item.variation.ram;
            return colorMatch && sizeMatch && ramMatch;
          }
        );
        
        console.log(`📦 Variation index found:`, variationIndex);
        
        if (variationIndex !== undefined && variationIndex >= 0) {
          const oldStock = product.variations[variationIndex].stock;
          
          // Trừ stock của variation
          product.variations[variationIndex].stock -= item.quantity;
          if (product.variations[variationIndex].stock < 0) {
            product.variations[variationIndex].stock = 0;
          }
          
          // Cập nhật in_stock tổng (tính lại từ variations)
          const totalVariationStock = product.variations?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
          product.in_stock = totalVariationStock;
          
          await product.save();
          
          const parts = [item.variation.color];
          if (item.variation.size) parts.push(item.variation.size);
          if (item.variation.ram) parts.push(`${item.variation.ram} RAM`);
          const variationDesc = parts.join(" - ");
          console.log(`✅ Updated stock for ${product.name} - ${variationDesc}:`);
          console.log(`   Old stock: ${oldStock}`);
          console.log(`   New stock: ${product.variations[variationIndex].stock}`);
          console.log(`   Total in_stock: ${product.in_stock}`);
        } else {
          const parts = [item.variation.color];
          if (item.variation.size) parts.push(item.variation.size);
          if (item.variation.ram) parts.push(`${item.variation.ram} RAM`);
          const variationDesc = parts.join(" - ");
          console.error(`❌ Variation not found for ${product.name} - ${variationDesc}`);
        }
      } else {
        // Cập nhật stock tổng
        const oldStock = product.in_stock;
        await Product.findByIdAndUpdate(
          item.product_id,
          { $inc: { in_stock: -item.quantity } }
        );
        
        // Reload để xem giá trị mới
        const updatedProduct = await Product.findById(item.product_id);
        console.log(`✅ Updated total stock for product ${product.name}:`);
        console.log(`   Old stock: ${oldStock}`);
        console.log(`   New stock: ${updatedProduct.in_stock}`);
      }
    }
    console.log("✅ Stock update process completed");

    // Populate để trả về thông tin sản phẩm
    await order.populate('items.product_id');

    res.status(201).json({
      success: true,
      message: "Đơn hàng đã được tạo thành công",
      data: order
    });

  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo đơn hàng",
      error: error.message
    });
  }
};

// Lấy danh sách đơn hàng
export const getOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.user?.role;
    
    let orders;
    
    if (userRole === "admin") {
      // Admin có thể xem tất cả đơn hàng
      orders = await Order.find({})
        .populate('items.product_id')
        .populate('user_id', 'name email')
        .sort({ createdAt: -1 });
    } else if (userId) {
      // User chỉ xem đơn hàng của mình
      orders = await Order.find({ user_id: userId })
        .populate('items.product_id')
        .sort({ createdAt: -1 });
    } else {
      return res.status(401).json({
        success: false,
        message: "Cần đăng nhập để xem đơn hàng"
      });
    }

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error("Error getting orders:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách đơn hàng",
      error: error.message
    });
  }
};

// Lấy danh sách đơn hàng của user (chỉ user)
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;
    console.log("🔍 getUserOrders - userId:", userId);

    if (!userId) {
      console.log("❌ getUserOrders - No userId found");
      return res.status(401).json({
        success: false,
        message: "Cần đăng nhập để xem đơn hàng"
      });
    }

    const orders = await Order.find({ user_id: userId })
      .populate('items.product_id')
      .sort({ createdAt: -1 });
    
    console.log(`✅ getUserOrders - Found ${orders.length} orders for user ${userId}`);

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error("Error getting user orders:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách đơn hàng",
      error: error.message
    });
  }
};

// Lấy chi tiết đơn hàng
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const order = await Order.findById(id).populate('items.product_id');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng"
      });
    }

    // Kiểm tra quyền truy cập (chỉ user sở hữu hoặc admin)
    if (userId && order.user_id && order.user_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập đơn hàng này"
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error("Error getting order:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin đơn hàng",
      error: error.message
    });
  }
};

// Cập nhật trạng thái đơn hàng (chỉ admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái đơn hàng không hợp lệ"
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('items.product_id');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng"
      });
    }

    res.json({
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: order
    });

  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái đơn hàng",
      error: error.message
    });
  }
};

// Thống kê doanh thu (chỉ admin)
export const getRevenueStats = async (req, res) => {
  try {
    console.log("📊 getRevenueStats called");
    const { startDate, endDate } = req.query;
    console.log("📊 Query params:", { startDate, endDate });

    // Tạo filter cho date range nếu có
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.order_date = {};
      if (startDate) {
        dateFilter.order_date.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.order_date.$lte = new Date(endDate);
      }
    }

    // Đơn hàng thành công (delivered)
    const successfulOrders = await Order.find({
      ...dateFilter,
      status: 'delivered'
    });

    // Đơn hàng không thành công (cancelled)
    const failedOrders = await Order.find({
      ...dateFilter,
      status: 'cancelled'
    });

    // Tính tổng doanh thu thành công
    const successfulRevenue = successfulOrders.reduce((sum, order) => {
      return sum + (order.total_amount || 0);
    }, 0);

    // Tính tổng doanh thu không thành công (đơn bị hủy)
    const failedRevenue = failedOrders.reduce((sum, order) => {
      return sum + (order.total_amount || 0);
    }, 0);

    // Tính tổng số đơn hàng
    const totalOrders = await Order.countDocuments(dateFilter);
    const totalSuccessfulOrders = successfulOrders.length;
    const totalFailedOrders = failedOrders.length;

    // Tính doanh thu thực tế (thành công - không thành công)
    const netRevenue = successfulRevenue - failedRevenue;

    // Thống kê theo trạng thái
    const statusStats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total_amount' }
        }
      }
    ]);

    // Thống kê theo tháng (nếu không có date filter)
    let monthlyStats = [];
    if (!startDate && !endDate) {
      monthlyStats = await Order.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$order_date' },
              month: { $month: '$order_date' }
            },
            successfulRevenue: {
              $sum: {
                $cond: [{ $eq: ['$status', 'delivered'] }, '$total_amount', 0]
              }
            },
            failedRevenue: {
              $sum: {
                $cond: [{ $eq: ['$status', 'cancelled'] }, '$total_amount', 0]
              }
            },
            successfulCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0]
              }
            },
            failedCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
              }
            }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]);
    }

    res.json({
      success: true,
      data: {
        summary: {
          successfulRevenue,
          failedRevenue,
          netRevenue,
          totalOrders,
          totalSuccessfulOrders,
          totalFailedOrders
        },
        statusStats,
        monthlyStats
      }
    });

  } catch (error) {
    console.error("Error getting revenue stats:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê doanh thu",
      error: error.message
    });
  }
};
