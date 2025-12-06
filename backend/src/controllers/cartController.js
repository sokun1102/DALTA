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
    const { product_id, quantity = 1, variation } = req.body;
    
    // Validate quantity
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Số lượng phải lớn hơn 0"
      });
    }
    
    // Kiểm tra sản phẩm có tồn tại không
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại"
      });
    }
    
    // Normalize variation object (loại bỏ undefined/null)
    const normalizedVariation = variation && (variation.color || variation.size || variation.ram) 
      ? {
          color: variation.color || undefined,
          size: variation.size || undefined,
          ram: variation.ram || undefined
        }
      : {};
    
    // Kiểm tra nếu product có variations thì phải chọn variation
    if (product.variations && product.variations.length > 0) {
      if (!normalizedVariation.color) {
        return res.status(400).json({
          success: false,
          message: "Sản phẩm này có nhiều biến thể. Vui lòng chọn màu sắc trước khi thêm vào giỏ hàng."
        });
      }
      
      // Tìm variation chính xác
      const variationItem = product.variations.find(v => {
        const colorMatch = v.color === normalizedVariation.color;
        const sizeMatch = !normalizedVariation.size || v.size === normalizedVariation.size;
        const ramMatch = !normalizedVariation.ram || v.ram === normalizedVariation.ram;
        return colorMatch && sizeMatch && ramMatch;
      });
      
      if (!variationItem) {
        const parts = [normalizedVariation.color];
        if (normalizedVariation.size) parts.push(normalizedVariation.size);
        if (normalizedVariation.ram) parts.push(`${normalizedVariation.ram} RAM`);
        const variationDesc = parts.join(" - ");
        return res.status(400).json({
          success: false,
          message: `Không tìm thấy biến thể "${variationDesc}" cho sản phẩm này`
        });
      }
      
      // Kiểm tra stock của variation
      if (variationItem.stock < quantity) {
        const parts = [normalizedVariation.color];
        if (normalizedVariation.size) parts.push(normalizedVariation.size);
        if (normalizedVariation.ram) parts.push(`${normalizedVariation.ram} RAM`);
        const variationDesc = parts.join(" - ");
        return res.status(400).json({
          success: false,
          message: `Số lượng sản phẩm "${variationDesc}" không đủ (còn ${variationItem.stock} sản phẩm)`
        });
      }
    } else {
      // Sản phẩm không có variations, kiểm tra stock tổng
      if (product.in_stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Số lượng sản phẩm không đủ (còn ${product.in_stock} sản phẩm)`
        });
      }
    }
    
    let cart = await Cart.findOne({ user_id: userId });
    
    if (!cart) {
      cart = new Cart({ user_id: userId, items: [] });
    }
    
    // Hàm so sánh variation
    const isSameVariation = (var1, var2) => {
      // Cả hai đều không có variation
      if ((!var1 || (!var1.color && !var1.size && !var1.ram)) && 
          (!var2 || (!var2.color && !var2.size && !var2.ram))) {
        return true;
      }
      // So sánh color, size và ram
      const color1 = var1?.color || "";
      const color2 = var2?.color || "";
      const size1 = var1?.size || "";
      const size2 = var2?.size || "";
      const ram1 = var1?.ram || "";
      const ram2 = var2?.ram || "";
      return color1 === color2 && size1 === size2 && ram1 === ram2;
    };
    
    // Kiểm tra sản phẩm đã có trong giỏ chưa (cùng product_id và variation)
    const existingItem = cart.items.find(item => {
      const sameProduct = item.product_id.toString() === product_id;
      const sameVariation = isSameVariation(item.variation, normalizedVariation);
      return sameProduct && sameVariation;
    });
    
    if (existingItem) {
      // Kiểm tra stock trước khi cập nhật quantity
      const newQuantity = existingItem.quantity + quantity;
      
      if (product.variations && product.variations.length > 0 && normalizedVariation.color) {
        const variationItem = product.variations.find(v => {
          const colorMatch = v.color === normalizedVariation.color;
          const sizeMatch = !normalizedVariation.size || v.size === normalizedVariation.size;
          const ramMatch = !normalizedVariation.ram || v.ram === normalizedVariation.ram;
          return colorMatch && sizeMatch && ramMatch;
        });
        
        if (variationItem && variationItem.stock < newQuantity) {
          const parts = [normalizedVariation.color];
          if (normalizedVariation.size) parts.push(normalizedVariation.size);
          if (normalizedVariation.ram) parts.push(`${normalizedVariation.ram} RAM`);
          const variationDesc = parts.join(" - ");
          return res.status(400).json({
            success: false,
            message: `Số lượng sản phẩm "${variationDesc}" không đủ. Hiện có ${existingItem.quantity} trong giỏ, thêm ${quantity} sẽ vượt quá số lượng còn lại (${variationItem.stock})`
          });
        }
      } else {
        if (product.in_stock < newQuantity) {
          return res.status(400).json({
            success: false,
            message: `Số lượng sản phẩm không đủ. Hiện có ${existingItem.quantity} trong giỏ, thêm ${quantity} sẽ vượt quá số lượng còn lại (${product.in_stock})`
          });
        }
      }
      
      // Cập nhật số lượng
      existingItem.quantity = newQuantity;
      existingItem.price_at_time = product.price;
    } else {
      // Thêm mới
      cart.items.push({
        product_id,
        quantity,
        price_at_time: product.price,
        variation: normalizedVariation
      });
    }
    
    await cart.save();
    
    // Populate để trả về thông tin đầy đủ
    await cart.populate('items.product_id');
    
    res.json({
      success: true,
      message: "Đã thêm vào giỏ hàng",
      data: cart
    });
  } catch (error) {
    console.error("Error in addToCart:", error);
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
    const { product_id, quantity, variation } = req.body;
    
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
    
    // Normalize variation
    const normalizedVariation = variation && (variation.color || variation.size || variation.ram) 
      ? {
          color: variation.color || undefined,
          size: variation.size || undefined,
          ram: variation.ram || undefined
        }
      : {};
    
    // Hàm so sánh variation
    const isSameVariation = (var1, var2) => {
      if ((!var1 || (!var1.color && !var1.size && !var1.ram)) && 
          (!var2 || (!var2.color && !var2.size && !var2.ram))) {
        return true;
      }
      const color1 = var1?.color || "";
      const color2 = var2?.color || "";
      const size1 = var1?.size || "";
      const size2 = var2?.size || "";
      const ram1 = var1?.ram || "";
      const ram2 = var2?.ram || "";
      return color1 === color2 && size1 === size2 && ram1 === ram2;
    };
    
    // Tìm item cùng product_id và variation
    const item = cart.items.find(item => {
      const sameProduct = item.product_id.toString() === product_id;
      const sameVariation = isSameVariation(item.variation, normalizedVariation);
      return sameProduct && sameVariation;
    });
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không có trong giỏ hàng"
      });
    }
    
    // Lấy thông tin product để kiểm tra stock
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại"
      });
    }
    
    // Kiểm tra stock trước khi cập nhật
    if (product.variations && product.variations.length > 0 && normalizedVariation.color) {
      const variationItem = product.variations.find(v => {
        const colorMatch = v.color === normalizedVariation.color;
        const sizeMatch = !normalizedVariation.size || v.size === normalizedVariation.size;
        const ramMatch = !normalizedVariation.ram || v.ram === normalizedVariation.ram;
        return colorMatch && sizeMatch && ramMatch;
      });
      
      if (!variationItem) {
        const parts = [normalizedVariation.color];
        if (normalizedVariation.size) parts.push(normalizedVariation.size);
        if (normalizedVariation.ram) parts.push(`${normalizedVariation.ram} RAM`);
        const variationDesc = parts.join(" - ");
        return res.status(400).json({
          success: false,
          message: `Không tìm thấy biến thể "${variationDesc}" cho sản phẩm này`
        });
      }
      
      if (variationItem.stock < quantity) {
        const parts = [normalizedVariation.color];
        if (normalizedVariation.size) parts.push(normalizedVariation.size);
        if (normalizedVariation.ram) parts.push(`${normalizedVariation.ram} RAM`);
        const variationDesc = parts.join(" - ");
        return res.status(400).json({
          success: false,
          message: `Số lượng sản phẩm "${variationDesc}" không đủ (còn ${variationItem.stock} sản phẩm)`
        });
      }
    } else {
      // Kiểm tra stock tổng
      if (product.in_stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Số lượng sản phẩm không đủ (còn ${product.in_stock} sản phẩm)`
        });
      }
    }
    
    if (quantity === 0) {
      // Xóa sản phẩm khỏi giỏ
      cart.items = cart.items.filter(cartItem => {
        const sameProduct = cartItem.product_id.toString() === product_id;
        const sameVariation = isSameVariation(cartItem.variation, normalizedVariation);
        return !(sameProduct && sameVariation);
      });
    } else {
      // Cập nhật số lượng
      item.quantity = quantity;
      item.price_at_time = product.price; // Cập nhật giá mới
    }
    
    await cart.save();
    
    // Populate để trả về thông tin đầy đủ
    await cart.populate('items.product_id');
    
    res.json({
      success: true,
      message: "Đã cập nhật giỏ hàng",
      data: cart
    });
  } catch (error) {
    console.error("Error in updateCartItem:", error);
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
    const { variation } = req.body; // Nhận variation từ body (optional)
    
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Giỏ hàng không tồn tại"
      });
    }
    
    // Normalize variation
    const normalizedVariation = variation && (variation.color || variation.size || variation.ram) 
      ? {
          color: variation.color || undefined,
          size: variation.size || undefined,
          ram: variation.ram || undefined
        }
      : null;
    
    // Hàm so sánh variation
    const isSameVariation = (var1, var2) => {
      if (!var2) return true; // Nếu không có variation trong request, xóa tất cả
      if ((!var1 || (!var1.color && !var1.size && !var1.ram)) && 
          (!var2 || (!var2.color && !var2.size && !var2.ram))) {
        return true;
      }
      const color1 = var1?.color || "";
      const color2 = var2?.color || "";
      const size1 = var1?.size || "";
      const size2 = var2?.size || "";
      const ram1 = var1?.ram || "";
      const ram2 = var2?.ram || "";
      return color1 === color2 && size1 === size2 && ram1 === ram2;
    };
    
    // Lọc items: giữ lại những item KHÔNG khớp với product_id và variation
    const beforeCount = cart.items.length;
    cart.items = cart.items.filter(item => {
      const sameProduct = item.product_id.toString() === product_id;
      if (!sameProduct) return true; // Giữ lại item khác product
      
      // Nếu có variation trong request, chỉ xóa item có variation khớp
      if (normalizedVariation) {
        return !isSameVariation(item.variation, normalizedVariation);
      }
      
      // Nếu không có variation trong request, xóa tất cả item của product này
      return false;
    });
    
    const afterCount = cart.items.length;
    
    if (beforeCount === afterCount) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm trong giỏ hàng"
      });
    }
    
    await cart.save();
    
    // Populate để trả về thông tin đầy đủ
    await cart.populate('items.product_id');
    
    res.json({
      success: true,
      message: "Đã xóa sản phẩm khỏi giỏ hàng",
      data: cart
    });
  } catch (error) {
    console.error("Error in removeFromCart:", error);
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
