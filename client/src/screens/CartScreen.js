import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API, { setAuthToken } from "../services/api";
import { imageUrl } from "../services/image";

export default function CartScreen({ navigation }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Chưa đăng nhập", "Vui lòng đăng nhập để xem giỏ hàng");
        navigation.navigate("Login");
        return;
      }

      setAuthToken(token);
      const response = await API.get("/cart");
      setCart(response.data.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
      Alert.alert("Lỗi", "Không thể tải giỏ hàng");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  };

  const updateQuantity = async (productId, newQuantity, variation = {}) => {
    try {
      if (newQuantity === 0) {
        await removeFromCart(productId);
        return;
      }

      const token = await AsyncStorage.getItem("token");
      setAuthToken(token);
      await API.put("/cart", {
        product_id: productId,
        quantity: newQuantity,
        variation: variation || {},
      });
      await fetchCart();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Không thể cập nhật số lượng";
      Alert.alert("Lỗi", errorMessage);
    }
  };

  const removeFromCart = async (productId, variation = {}, productName = "") => {
    Alert.alert(
      "Xóa sản phẩm",
      `Bạn có chắc chắn muốn xóa "${productName || "sản phẩm này"}" khỏi giỏ hàng?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              setAuthToken(token);
              
              // Xóa bằng cách set quantity = 0 với variation
              await API.put("/cart", {
                product_id: productId,
                quantity: 0,
                variation: variation || {},
              });
              
              await fetchCart();
            } catch (error) {
              const errorMessage = error.response?.data?.message || "Không thể xóa sản phẩm khỏi giỏ hàng";
              Alert.alert("Lỗi", errorMessage);
            }
          },
        },
      ]
    );
  };

  const clearCart = async () => {
    Alert.alert(
      "Xóa giỏ hàng",
      "Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              setAuthToken(token);
              await API.delete("/cart");
              await fetchCart();
            } catch (error) {
              Alert.alert("Lỗi", "Không thể xóa giỏ hàng");
            }
          },
        },
      ]
    );
  };

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce(
      (total, item) => total + item.price_at_time * item.quantity,
      0
    );
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image
        source={
          item.product_id?.imageUrl
            ? { uri: imageUrl(item.product_id.imageUrl) }
            : require("../../assets/depositphotos_57530297-stock-illustration-shopping-cart-icon.jpg")
        }
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.itemInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.product_id?.name || "Sản phẩm không tồn tại"}
        </Text>
        {item.variation?.color && (
          <Text style={styles.variationText}>
            Màu: {item.variation.color}
          </Text>
        )}
        <Text style={styles.productPrice}>
          {item.price_at_time?.toLocaleString("vi-VN")}đ
        </Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.product_id._id, item.quantity - 1, item.variation)}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.product_id._id, item.quantity + 1, item.variation)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromCart(
          item.product_id._id, 
          item.variation || {}, 
          item.product_id?.name
        )}
        activeOpacity={0.7}
      >
        <View style={styles.removeButtonContent}>
          <Text style={styles.removeButtonIcon}>🗑️</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Quay lại</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Giỏ hàng</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải giỏ hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Giỏ hàng</Text>
        {cart?.items?.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearCart}>
            <Text style={styles.clearButtonText}>Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {!cart || !cart.items || cart.items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Giỏ hàng trống</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.shopButtonText}>Mua sắm ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart.items}
            renderItem={renderCartItem}
            keyExtractor={(item, index) => 
              `${item.product_id._id}_${item.variation?.color || 'no_variation'}_${item.variation?.size || ''}_${index}`
            }
            style={styles.cartList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalAmount}>
                {calculateTotal().toLocaleString("vi-VN")}đ
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={() => navigation.navigate("Checkout", { cartItems: cart.items })}
            >
              <Text style={styles.checkoutButtonText}>Thanh toán</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(239, 68, 68, 0.2)",
    backgroundColor: "#0a0a0a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
  },
  backButtonText: {
    color: "#ef4444",
    fontSize: 18,
    fontWeight: "700",
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    flex: 1,
    letterSpacing: 0.5,
    textShadowColor: "rgba(239, 68, 68, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#ef4444",
  },
  clearButtonText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 22,
    marginBottom: 32,
    fontWeight: "700",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  shopButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  shopButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cartList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  itemInfo: {
    flex: 1,
  },
  productName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  variationText: {
    color: "#9ca3af",
    fontSize: 13,
    marginBottom: 8,
    fontWeight: "500",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  productPrice: {
    color: "#ef4444",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
    borderRadius: 12,
    padding: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  quantityButton: {
    backgroundColor: "#2a2a2a",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  quantityButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  quantity: {
    color: "#fff",
    fontSize: 16,
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: "center",
    fontWeight: "700",
  },
  removeButton: {
    padding: 12,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(239, 68, 68, 0.4)",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  removeButtonContent: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonIcon: {
    fontSize: 20,
  },
  footer: {
    backgroundColor: "#0a0a0a",
    padding: 20,
    borderTopWidth: 3,
    borderTopColor: "rgba(239, 68, 68, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  totalLabel: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  totalAmount: {
    color: "#ef4444",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0.5,
    textShadowColor: "rgba(239, 68, 68, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  checkoutButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
