import express from "express";
import { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart 
} from "../controllers/cartController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(auth);

// GET /api/cart - Lấy giỏ hàng
router.get("/", getCart);

// POST /api/cart - Thêm sản phẩm vào giỏ hàng
router.post("/", addToCart);

// PUT /api/cart - Cập nhật số lượng sản phẩm
router.put("/", updateCartItem);

// DELETE /api/cart/:product_id - Xóa sản phẩm khỏi giỏ hàng
router.delete("/:product_id", removeFromCart);

// DELETE /api/cart - Xóa toàn bộ giỏ hàng
router.delete("/", clearCart);

export default router;
