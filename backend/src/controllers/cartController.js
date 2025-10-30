import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// Lấy giỏ hàng của user
export const getCart = async (req, res) => {
  try {
    const userId = req.userId;
    
    let cart = await Cart.findOne({ user_id: userId }).populate('items.product_id');
    
    if (!cart) {
      cart = new Cart({ user_id: userId, items: [] });
      await cart.save();
    }
    
    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy giỏ hàng",
      error: error.message
    });
  }
};

// Thêm sản phẩm vào giỏ hàng
export const addToCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { product_id, quantity = 1 } = req.body;
    
    // Kiểm tra sản phẩm có tồn tại không
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại"
      });
    }
    
    // Kiểm tra số lượng tồn kho
    if (product.in_stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Số lượng sản phẩm không đủ"
      });
    }
    
    let cart = await Cart.findOne({ user_id: userId });
    
    if (!cart) {
      cart = new Cart({ user_id: userId, items: [] });
    }
    
    // Kiểm tra sản phẩm đã có trong giỏ chưa
    const existingItem = cart.items.find(item => 
      item.product_id.toString() === product_id
    );
    
    if (existingItem) {
      // Cập nhật số lượng
      existingItem.quantity += quantity;
      existingItem.price_at_time = product.price;
    } else {
      // Thêm mới
      cart.items.push({
        product_id,
        quantity,
        price_at_time: product.price
      });
    }
    
    await cart.save();
    
    res.json({
      success: true,
      message: "Đã thêm vào giỏ hàng",
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi thêm vào giỏ hàng",
      error: error.message
    });
  }
};

// Cập nhật số lượng sản phẩm trong giỏ
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.userId;
    const { product_id, quantity } = req.body;
    
    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Số lượng không hợp lệ"
      });
    }
    
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Giỏ hàng không tồn tại"
      });
    }
    
    const item = cart.items.find(item => 
      item.product_id.toString() === product_id
    );
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không có trong giỏ hàng"
      });
    }
    
    if (quantity === 0) {
      // Xóa sản phẩm khỏi giỏ
      cart.items = cart.items.filter(item => 
        item.product_id.toString() !== product_id
      );
    } else {
      // Cập nhật số lượng
      item.quantity = quantity;
    }
    
    await cart.save();
    
    res.json({
      success: true,
      message: "Đã cập nhật giỏ hàng",
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật giỏ hàng",
      error: error.message
    });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { product_id } = req.params;
    
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Giỏ hàng không tồn tại"
      });
    }
    
    cart.items = cart.items.filter(item => 
      item.product_id.toString() !== product_id
    );
    
    await cart.save();
    
    res.json({
      success: true,
      message: "Đã xóa sản phẩm khỏi giỏ hàng",
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa sản phẩm khỏi giỏ hàng",
      error: error.message
    });
  }
};

// Xóa toàn bộ giỏ hàng
export const clearCart = async (req, res) => {
  try {
    const userId = req.userId;
    
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Giỏ hàng không tồn tại"
      });
    }
    
    cart.items = [];
    await cart.save();
    
    res.json({
      success: true,
      message: "Đã xóa toàn bộ giỏ hàng",
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa giỏ hàng",
      error: error.message
    });
  }
};
