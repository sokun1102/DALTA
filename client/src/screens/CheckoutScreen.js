import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../services/api";

export default function CheckoutScreen({ navigation, route }) {
  const { cartItems = [] } = route.params || {};
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    paymentMethod: "cod", // cod = cash on delivery
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load user info if logged in, otherwise load saved form data
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        // User đã đăng nhập - lấy thông tin từ token hoặc API
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const user = JSON.parse(userData);
          setFormData({
            customerName: user.name || "",
            customerEmail: user.email || "",
            customerPhone: user.phone_number || "",
            customerAddress: user.addresses?.[0] || "", // Lấy địa chỉ đầu tiên nếu có
            paymentMethod: "cod",
            notes: "",
          });
        }
      } else {
        // User chưa đăng nhập - load saved form data
        loadSavedFormData();
      }
    } catch (error) {
      console.error("Error loading user info:", error);
      // Fallback to saved form data
      loadSavedFormData();
    }
  };

  const loadSavedFormData = async () => {
    try {
      const savedData = await AsyncStorage.getItem("checkoutFormData");
      if (savedData) {
        setFormData(JSON.parse(savedData));
      }
    } catch (error) {
      console.error("Error loading saved form data:", error);
    }
  };

  const saveFormData = async (data) => {
    try {
      await AsyncStorage.setItem("checkoutFormData", JSON.stringify(data));
    } catch (error) {
      console.error("Error saving form data:", error);
    }
  };

  const handleInputChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    saveFormData(newData);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      // Xử lý cả 2 trường hợp: từ CartScreen (có price_at_time) và từ GuestCartScreen (có price)
      const price = item.price_at_time || item.price || item.product_id?.price || 0;
      return total + price * item.quantity;
    }, 0);
  };

  const calculateTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const validateForm = () => {
    if (!formData.customerName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ tên");
      return false;
    }
    if (!formData.customerEmail.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập email");
      return false;
    }
    if (!formData.customerPhone.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
      return false;
    }
    if (!formData.customerAddress.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập địa chỉ giao hàng");
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.customerEmail)) {
      Alert.alert("Lỗi", "Email không hợp lệ");
      return false;
    }
    
    // Basic phone validation
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(formData.customerPhone.replace(/\s/g, ""))) {
      Alert.alert("Lỗi", "Số điện thoại phải có 10-11 chữ số");
      return false;
    }
    
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    
    if (cartItems.length === 0) {
      Alert.alert("Lỗi", "Giỏ hàng trống");
      return;
    }

    try {
      setLoading(true);
      
      // Tạo đơn hàng
      const orderData = {
        customer: {
          name: formData.customerName,
          email: formData.customerEmail,
          phone: formData.customerPhone,
          address: formData.customerAddress,
        },
        items: cartItems.map(item => ({
          product_id: item.product_id?._id || item.product_id,
          quantity: item.quantity,
          price: item.price_at_time || item.price || item.product_id?.price || 0,
        })),
        payment_method: formData.paymentMethod,
        notes: formData.notes,
        total_amount: calculateTotal(),
        status: "pending",
      };

      // Gửi đơn hàng lên server
      const response = await API.post("/orders", orderData);
      
      if (response.data.success) {
        console.log("Order created:", response.data.data);
      } else {
        throw new Error(response.data.message || "Không thể tạo đơn hàng");
      }
      
      // Clear cart and form data
      await AsyncStorage.removeItem("guestCart");
      await AsyncStorage.removeItem("checkoutFormData");
      
      Alert.alert(
        "Đặt hàng thành công!",
        `Cảm ơn bạn đã đặt hàng. Mã đơn hàng: ${response.data.data.order_number}\n\nChúng tôi sẽ liên hệ với bạn trong vòng 24h để xác nhận đơn hàng.`,
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Home")
          }
        ]
      );
      
    } catch (error) {
      console.error("Error placing order:", error);
      Alert.alert("Lỗi", "Không thể đặt hàng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Quay lại</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Thanh toán</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Giỏ hàng trống</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.shopButtonText}>Mua sắm ngay</Text>
          </TouchableOpacity>
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
        <Text style={styles.title}>Thanh toán</Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Đơn hàng của bạn</Text>
            <View style={styles.orderSummary}>
              <Text style={styles.summaryText}>
                {calculateTotalItems()} sản phẩm
              </Text>
              <Text style={styles.totalAmount}>
                {calculateTotal().toLocaleString("vi-VN")}đ
              </Text>
            </View>
          </View>

          {/* Customer Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
            {formData.customerName && (
              <Text style={styles.autoFillNotice}>
                ✅ Thông tin đã được điền sẵn từ tài khoản của bạn
              </Text>
            )}
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Họ và tên *</Text>
              <TextInput
                style={styles.input}
                value={formData.customerName}
                onChangeText={(value) => handleInputChange("customerName", value)}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={formData.customerEmail}
                onChangeText={(value) => handleInputChange("customerEmail", value)}
                placeholder="Nhập email"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Số điện thoại *</Text>
              <TextInput
                style={styles.input}
                value={formData.customerPhone}
                onChangeText={(value) => handleInputChange("customerPhone", value)}
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Địa chỉ giao hàng *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.customerAddress}
                onChangeText={(value) => handleInputChange("customerAddress", value)}
                placeholder="Nhập địa chỉ giao hàng chi tiết"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            <View style={styles.paymentOptions}>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  formData.paymentMethod === "cod" && styles.paymentOptionSelected
                ]}
                onPress={() => handleInputChange("paymentMethod", "cod")}
              >
                <Text style={[
                  styles.paymentOptionText,
                  formData.paymentMethod === "cod" && styles.paymentOptionTextSelected
                ]}>
                  💰 Thanh toán khi nhận hàng (COD)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi chú (tùy chọn)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(value) => handleInputChange("notes", value)}
              placeholder="Ghi chú thêm cho đơn hàng..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Place Order Button */}
          <TouchableOpacity
            style={[styles.placeOrderButton, loading && styles.placeOrderButtonDisabled]}
            onPress={handlePlaceOrder}
            disabled={loading}
          >
            <Text style={styles.placeOrderButtonText}>
              {loading ? "Đang xử lý..." : `Đặt hàng - ${calculateTotal().toLocaleString("vi-VN")}đ`}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: {
    flex: 1,
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
  section: {
    backgroundColor: "#1a1a1a",
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  autoFillNotice: {
    color: "#10b981",
    fontSize: 14,
    marginBottom: 16,
    fontStyle: "italic",
  },
  orderSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  totalAmount: {
    color: "#ef4444",
    fontSize: 18,
    fontWeight: "bold",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  paymentOptions: {
    gap: 12,
  },
  paymentOption: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 8,
    padding: 16,
  },
  paymentOptionSelected: {
    borderColor: "#ef4444",
    backgroundColor: "#2a1a1a",
  },
  paymentOptionText: {
    color: "#fff",
    fontSize: 14,
  },
  paymentOptionTextSelected: {
    color: "#ef4444",
    fontWeight: "600",
  },
  placeOrderButton: {
    backgroundColor: "#ef4444",
    margin: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  placeOrderButtonDisabled: {
    backgroundColor: "#666",
  },
  placeOrderButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
