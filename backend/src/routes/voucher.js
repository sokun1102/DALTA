// routes/voucher.js
import express from "express";
import {
  getUserVouchers,
  getVoucherById,
  createVoucher,
  markVoucherAsUsed,
} from "../controllers/voucherController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Lấy tất cả voucher của user
router.get("/users/me/vouchers", auth, getUserVouchers);

// Lấy voucher theo ID
router.get("/users/me/vouchers/:voucherId", auth, getVoucherById);

// Tạo voucher mới (có thể dùng cho admin hoặc phát voucher cho user)
router.post("/users/me/vouchers", auth, createVoucher);

// Đánh dấu voucher đã sử dụng
router.put("/users/me/vouchers/:voucherId/use", auth, markVoucherAsUsed);

export default router;

