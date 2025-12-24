import Order from "../models/Order.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

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

    // Tạo order number (tránh race condition bằng cách dùng timestamp + random)
    let order_number;
    let order;
    let retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries) {
      // Tạo order_number từ timestamp và số ngẫu nhiên để đảm bảo tính duy nhất
      const timestamp = Date.now().toString().slice(-8); // 8 số cuối của timestamp
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      order_number = `ORD${timestamp}${random}`;

      try {
        // Tạo đơn hàng
        order = new Order({
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
        break; // Thành công, thoát vòng lặp
      } catch (error) {
        // Nếu lỗi duplicate key (order_number đã tồn tại), thử lại
        if (error.code === 11000 && error.keyPattern?.order_number) {
          retries++;
          if (retries >= maxRetries) {
            throw new Error("Không thể tạo order_number duy nhất sau nhiều lần thử");
          }
          continue; // Thử lại với order_number mới
        }
        throw error; // Nếu là lỗi khác, throw ngay
      }
    }

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

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID đơn hàng không hợp lệ"
      });
    }

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

// Lấy danh sách đơn hàng của user hiện tại
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Cần đăng nhập để xem đơn hàng"
      });
    }

    const orders = await Order.find({ user_id: userId })
      .populate('items.product_id')
      .sort({ createdAt: -1 });

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

// Thống kê doanh thu (chỉ admin)
export const getRevenueStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Tạo filter date nếu có
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.order_date = {};
      if (startDate) {
        dateFilter.order_date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Đến cuối ngày
        dateFilter.order_date.$lte = end;
      }
    }

    // Tính tổng doanh thu theo trạng thái
    const summaryResult = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total_amount" },
          successfulRevenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "delivered"] }, "$total_amount", 0]
            }
          },
          failedRevenue: {
            $sum: {
              $cond: [
                { $in: ["$status", ["cancelled"]] },
                "$total_amount",
                0
              ]
            }
          },
          totalOrders: { $sum: 1 },
          totalSuccessfulOrders: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] }
          },
          totalFailedOrders: {
            $sum: { $cond: [{ $in: ["$status", ["cancelled"]] }, 1, 0] }
          }
        }
      }
    ]);

    const summary = summaryResult[0] || {
      totalRevenue: 0,
      successfulRevenue: 0,
      failedRevenue: 0,
      totalOrders: 0,
      totalSuccessfulOrders: 0,
      totalFailedOrders: 0
    };

    summary.netRevenue = summary.successfulRevenue - summary.failedRevenue;

    // Thống kê theo trạng thái
    const statusStats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$total_amount" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Thống kê theo tháng
    const monthlyStats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: "$order_date" },
            month: { $month: "$order_date" }
          },
          successfulRevenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "delivered"] }, "$total_amount", 0]
            }
          },
          failedRevenue: {
            $sum: {
              $cond: [
                { $in: ["$status", ["cancelled"]] },
                "$total_amount",
                0
              ]
            }
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 } // Lấy 12 tháng gần nhất
    ]);

    res.json({
      success: true,
      data: {
        summary,
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
