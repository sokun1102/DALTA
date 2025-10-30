import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Product from "../models/Product.js";
import auth from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from "../controllers/productController.js";

const router = express.Router();

// Multer setup for product images (resolve relative to this file)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "uploads", "products");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `prod_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// Product routes
router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", auth, adminAuth, createProduct);
router.put("/:id", auth, adminAuth, updateProduct);
router.delete("/:id", auth, adminAuth, deleteProduct);

// Upload product image
router.post("/:id/image", auth, adminAuth, upload.single("image"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    const relPath = `/uploads/products/${req.file.filename}`;
    product.imageUrl = relPath;
    await product.save();
    res.json({ success: true, message: "Image uploaded", data: { imageUrl: relPath } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
