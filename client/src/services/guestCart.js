import AsyncStorage from "@react-native-async-storage/async-storage";

const GUEST_CART_KEY = "guestCart";

// Lấy giỏ hàng từ local storage
export const getGuestCart = async () => {
  try {
    const cartData = await AsyncStorage.getItem(GUEST_CART_KEY);
    return cartData ? JSON.parse(cartData) : [];
  } catch (error) {
    console.error("Error getting guest cart:", error);
    return [];
  }
};

// Lưu giỏ hàng vào local storage
export const saveGuestCart = async (cartItems) => {
  try {
    await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
  } catch (error) {
    console.error("Error saving guest cart:", error);
  }
};

// Thêm sản phẩm vào giỏ hàng
export const addToGuestCart = async (product, quantity = 1, variation = {}) => {
  try {
    const cartItems = await getGuestCart();
    
    // Kiểm tra sản phẩm đã có trong giỏ chưa (cùng product_id và variation)
    const existingItemIndex = cartItems.findIndex(item => {
      const sameProduct = item.product_id._id === product._id;
      const sameVariation = (!item.variation && !variation.color) || 
        (item.variation?.color === variation?.color && 
         item.variation?.size === variation?.size);
      return sameProduct && sameVariation;
    });
    
    if (existingItemIndex >= 0) {
      // Cập nhật số lượng
      cartItems[existingItemIndex].quantity += quantity;
    } else {
      // Thêm mới
      cartItems.push({
        product_id: product,
        quantity: quantity,
        price_at_time: product.price,
        variation: variation || {},
      });
    }
    
    await saveGuestCart(cartItems);
    return cartItems;
  } catch (error) {
    console.error("Error adding to guest cart:", error);
    return [];
  }
};

// Cập nhật số lượng sản phẩm
export const updateGuestCartItem = async (productId, quantity, variation = {}) => {
  try {
    const cartItems = await getGuestCart();
    
    if (quantity <= 0) {
      // Xóa sản phẩm (cùng product_id và variation)
      const updatedItems = cartItems.filter(item => {
        const sameProduct = item.product_id._id === productId;
        const sameVariation = (!item.variation && !variation.color) || 
          (item.variation?.color === variation?.color && 
           item.variation?.size === variation?.size);
        return !(sameProduct && sameVariation);
      });
      await saveGuestCart(updatedItems);
      return updatedItems;
    } else {
      // Cập nhật số lượng (tìm item cùng product_id và variation)
      const updatedItems = cartItems.map(item => {
        const sameProduct = item.product_id._id === productId;
        const sameVariation = (!item.variation && !variation.color) || 
          (item.variation?.color === variation?.color && 
           item.variation?.size === variation?.size);
        if (sameProduct && sameVariation) {
          return { ...item, quantity };
        }
        return item;
      });
      await saveGuestCart(updatedItems);
      return updatedItems;
    }
  } catch (error) {
    console.error("Error updating guest cart item:", error);
    return [];
  }
};

// Xóa sản phẩm khỏi giỏ hàng
export const removeFromGuestCart = async (productId) => {
  try {
    const cartItems = await getGuestCart();
    const updatedItems = cartItems.filter(
      item => item.product_id._id !== productId
    );
    await saveGuestCart(updatedItems);
    return updatedItems;
  } catch (error) {
    console.error("Error removing from guest cart:", error);
    return [];
  }
};

// Xóa toàn bộ giỏ hàng
export const clearGuestCart = async () => {
  try {
    await AsyncStorage.removeItem(GUEST_CART_KEY);
    return [];
  } catch (error) {
    console.error("Error clearing guest cart:", error);
    return [];
  }
};

// Đếm tổng số sản phẩm trong giỏ
export const getGuestCartCount = async () => {
  try {
    const cartItems = await getGuestCart();
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  } catch (error) {
    console.error("Error getting guest cart count:", error);
    return 0;
  }
};

// Tính tổng tiền
export const getGuestCartTotal = async () => {
  try {
    const cartItems = await getGuestCart();
    return cartItems.reduce((total, item) => {
      return total + (item.price_at_time || item.product_id?.price || 0) * item.quantity;
    }, 0);
  } catch (error) {
    console.error("Error getting guest cart total:", error);
    return 0;
  }
};
