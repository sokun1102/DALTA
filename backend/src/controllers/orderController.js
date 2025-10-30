import Order from "../models/Order.js";
import Product from "../models/Product.js";

// Tạo đơn hàng mới
export const createOrder = async (req, res) => {
  try {
    const {
      customer,
      items,
      payment_method = "cod",
      notes = "",
      total_amount
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

    // Kiểm tra sản phẩm có tồn tại không
    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm với ID ${item.product_id} không tồn tại`
        });
      }

      // Kiểm tra số lượng tồn kho
      if (product.in_stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm ${product.name} không đủ số lượng tồn kho`
        });
      }
    }

    // Tạo order number
    const count = await Order.countDocuments();
    const order_number = `ORD${String(count + 1).padStart(6, '0')}`;

    // Tạo đơn hàng
    const order = new Order({
      user_id: req.userId || null, // null nếu là khách vãng lai
      order_number,
      customer,
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      })),
      payment_method,
      notes,
      total_amount
    });

    await order.save();

    // Cập nhật số lượng tồn kho
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product_id,
        { $inc: { in_stock: -item.quantity } }
      );
    }

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
