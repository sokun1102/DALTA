import express from "express";
import {
  getPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
} from "../controllers/paymentMethodController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(auth);

// GET /api/payment-methods - Lấy danh sách phương thức thanh toán của user
router.get("/", getPaymentMethods);

// GET /api/payment-methods/:id - Lấy chi tiết một phương thức thanh toán
router.get("/:id", getPaymentMethodById);

// POST /api/payment-methods - Tạo phương thức thanh toán mới
router.post("/", createPaymentMethod);

// PUT /api/payment-methods/:id - Cập nhật phương thức thanh toán
router.put("/:id", updatePaymentMethod);

// DELETE /api/payment-methods/:id - Xóa phương thức thanh toán
router.delete("/:id", deletePaymentMethod);

// PUT /api/payment-methods/:id/default - Đặt làm phương thức mặc định
router.put("/:id/default", setDefaultPaymentMethod);

export default router;

