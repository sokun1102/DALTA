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

  const updateQuantity = async (productId, newQuantity) => {
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
      });
      await fetchCart();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật số lượng");
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      setAuthToken(token);
      await API.delete(`/cart/${productId}`);
      await fetchCart();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể xóa sản phẩm khỏi giỏ hàng");
    }
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
        <Text style={styles.productPrice}>
          {item.price_at_time?.toLocaleString("vi-VN")}đ
        </Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.product_id._id, item.quantity - 1)}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.product_id._id, item.quantity + 1)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromCart(item.product_id._id)}
      >
        <Text style={styles.removeButtonText}>🗑️</Text>
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
            keyExtractor={(item) => item.product_id._id}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ef4444",
    borderRadius: 6,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
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
    fontSize: 18,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cartList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    alignItems: "center",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  productName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  productPrice: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    backgroundColor: "#333",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  quantity: {
    color: "#fff",
    fontSize: 16,
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: "center",
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    fontSize: 16,
  },
  footer: {
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  totalAmount: {
    color: "#ef4444",
    fontSize: 20,
    fontWeight: "bold",
  },
  checkoutButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
