import express from "express";
import { 
  createOrder, 
  getOrders, 
  getOrderById, 
  updateOrderStatus 
} from "../controllers/orderController.js";
import auth from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// POST /api/orders - Tạo đơn hàng mới (không cần auth cho khách vãng lai)
router.post("/", createOrder);

// GET /api/orders - Lấy danh sách đơn hàng của user (cần auth)
router.get("/", auth, getOrders);

// GET /api/orders/:id - Lấy chi tiết đơn hàng
router.get("/:id", getOrderById);

// PUT /api/orders/:id/status - Cập nhật trạng thái đơn hàng (chỉ admin)
router.put("/:id/status", auth, adminAuth, updateOrderStatus);

export default router;
