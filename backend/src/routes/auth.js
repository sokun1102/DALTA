import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUsers,
  getUserById,
  getMe,
  updateProfile,
  uploadAvatar,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress
} from "../controllers/authController.js";
import {
  getUserVouchers,
  getVoucherById,
  createVoucher,
  createSampleVouchers,
  validateVoucherByCode,
  markVoucherAsUsed,
  deleteVoucher,
  deleteAllUserVouchers,
} from "../controllers/voucherController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Multer setup for avatar uploads
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const avatarUploadDir = path.join(__dirname, "..", "uploads", "avatars");
if (!fs.existsSync(avatarUploadDir)) fs.mkdirSync(avatarUploadDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${Date.now()}${ext}`);
  },
});

const uploadAvatarMulter = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  }
});

// Auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/users", getUsers);

// User me routes - phải đặt TRƯỚC /users/:id để tránh conflict
router.get("/users/me", auth, getMe);
router.put("/users/me", auth, updateProfile);
router.post("/users/me/avatar", auth, uploadAvatarMulter.single("avatar"), uploadAvatar);

// Address routes - phải đặt TRƯỚC /users/:id
router.get("/users/me/addresses", auth, getAddresses);
router.post("/users/me/addresses", auth, addAddress);
router.put("/users/me/addresses/:addressId", auth, updateAddress);
router.delete("/users/me/addresses/:addressId", auth, deleteAddress);

// Voucher routes - phải đặt TRƯỚC /users/:id
// Các route cụ thể phải đặt TRƯỚC route có parameter (:voucherId)
router.get("/users/me/vouchers", auth, getUserVouchers);
router.post("/users/me/vouchers", auth, createVoucher);
router.post("/users/me/vouchers/sample", auth, createSampleVouchers);
router.post("/users/me/vouchers/validate", auth, validateVoucherByCode);
router.delete("/users/me/vouchers/all", auth, deleteAllUserVouchers);
// Các route có parameter đặt SAU các route cụ thể
router.get("/users/me/vouchers/:voucherId", auth, getVoucherById);
router.put("/users/me/vouchers/:voucherId/use", auth, markVoucherAsUsed);
router.delete("/users/me/vouchers/:voucherId", auth, deleteVoucher);

// Generic user routes - đặt SAU các route cụ thể
router.get("/users/:id", getUserById);

export default router;
