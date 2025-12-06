import express from "express";
import { 
  createOrder, 
  getOrders, 
  getUserOrders,
  getOrderById, 
  updateOrderStatus,
  getRevenueStats
} from "../controllers/orderController.js";
import auth from "../middleware/auth.js";
import optionalAuth from "../middleware/optionalAuth.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// POST /api/orders - Tạo đơn hàng mới (optional auth - lấy userId nếu có token)
router.post("/", optionalAuth, createOrder);

// GET /api/orders - Lấy danh sách đơn hàng (cần auth, admin xem tất cả, user xem của mình)
router.get("/", auth, getOrders);

// Các route cụ thể phải đặt TRƯỚC route có parameter (:id)
// GET /api/orders/user-orders - Lấy danh sách đơn hàng của user (chỉ user)
router.get("/user-orders", auth, getUserOrders);

// GET /api/orders/stats/revenue - Thống kê doanh thu (chỉ admin)
router.get("/stats/revenue", auth, adminAuth, getRevenueStats);

// Route có parameter đặt SAU các route cụ thể
// GET /api/orders/:id - Lấy chi tiết đơn hàng
router.get("/:id", getOrderById);

// PUT /api/orders/:id/status - Cập nhật trạng thái đơn hàng (chỉ admin)
router.put("/:id/status", auth, adminAuth, updateOrderStatus);

export default router;
