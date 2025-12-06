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
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API, { setAuthToken } from "../services/api";

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
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [voucherModalVisible, setVoucherModalVisible] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [paymentMethodModalVisible, setPaymentMethodModalVisible] = useState(false);

  useEffect(() => {
    // Load user info if logged in, otherwise load saved form data
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        setAuthToken(token);
        
        // Fetch user info từ API
        try {
          const userResponse = await API.get("/auth/users/me");
          if (userResponse.data?.success) {
            const user = userResponse.data.data;
            
            // Fetch địa chỉ đã lưu
            try {
              const addressesResponse = await API.get("/auth/users/me/addresses");
              if (addressesResponse.data?.success) {
                const addresses = addressesResponse.data.data || [];
                setSavedAddresses(addresses);
                
                // Tìm địa chỉ mặc định hoặc lấy địa chỉ đầu tiên
                const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0];
                
                if (defaultAddress) {
                  setSelectedAddress(defaultAddress);
                  // Format địa chỉ đầy đủ
                  const fullAddress = formatAddress(defaultAddress);
                  
                  setFormData({
                    customerName: defaultAddress.name || user.name || "",
                    customerEmail: user.email || "",
                    customerPhone: defaultAddress.phone || user.phone_number || "",
                    customerAddress: fullAddress,
                    paymentMethod: "cod",
                    notes: "",
                  });
                } else {
                  // Không có địa chỉ đã lưu, dùng thông tin user
                  setFormData({
                    customerName: user.name || "",
                    customerEmail: user.email || "",
                    customerPhone: user.phone_number || "",
                    customerAddress: "",
                    paymentMethod: "cod",
                    notes: "",
                  });
                }
              }
            } catch (addrError) {
              console.log("No saved addresses or error:", addrError);
            }
            
            // Fetch payment methods đã lưu
            try {
              const paymentMethodsResponse = await API.get("/payment-methods");
              if (paymentMethodsResponse.data?.success) {
                const paymentMethods = paymentMethodsResponse.data.data || [];
                setSavedPaymentMethods(paymentMethods);
                
                // Tìm payment method mặc định
                const defaultPaymentMethod = paymentMethods.find(pm => pm.is_default);
                if (defaultPaymentMethod) {
                  setSelectedPaymentMethod(defaultPaymentMethod);
                  // Map payment method type to order payment_method
                  const paymentMethodMap = {
                    credit_card: "credit_card",
                    debit_card: "credit_card",
                    bank_account: "bank_transfer",
                    e_wallet: "bank_transfer",
                    cod: "cod",
                  };
                  const orderPaymentMethod = paymentMethodMap[defaultPaymentMethod.type] || "cod";
                  setFormData(prev => ({
                    ...prev,
                    paymentMethod: orderPaymentMethod,
                  }));
                }
              }
            } catch (pmError) {
              console.log("No saved payment methods or error:", pmError);
            }
            
            return;
            
            // Fallback: dùng thông tin user nếu không có địa chỉ
            setFormData({
              customerName: user.name || "",
              customerEmail: user.email || "",
              customerPhone: user.phone_number || "",
              customerAddress: "",
              paymentMethod: "cod",
              notes: "",
            });
          }
        } catch (apiError) {
          console.error("Error fetching user info:", apiError);
          // Fallback to saved form data
          loadSavedFormData();
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

  const formatAddress = (address) => {
    if (!address) return "";
    const parts = [
      address.street,
      address.ward,
      address.district,
      address.city,
      address.zip
    ].filter(Boolean);
    return parts.join(", ");
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

  const calculateSubTotal = () => {
    return cartItems.reduce((total, item) => {
      // Xử lý cả 2 trường hợp: từ CartScreen (có price_at_time) và từ GuestCartScreen (có price)
      const price = item.price_at_time || item.price || item.product_id?.price || 0;
      return total + price * item.quantity;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubTotal();
    return Math.max(0, subtotal - voucherDiscount);
  };

  const calculateTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getPaymentMethodLabel = (type) => {
    const typeMap = {
      credit_card: "Thẻ tín dụng",
      debit_card: "Thẻ ghi nợ",
      bank_account: "Tài khoản ngân hàng",
      e_wallet: "Ví điện tử",
      cod: "Thanh toán khi nhận hàng",
    };
    return typeMap[type] || type;
  };

  const getPaymentMethodIcon = (type) => {
    const iconMap = {
      credit_card: "💳",
      debit_card: "💳",
      bank_account: "🏦",
      e_wallet: "📱",
      cod: "💰",
    };
    return iconMap[type] || "💳";
  };

  const handleSelectPaymentMethod = (paymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    // Map payment method type to order payment_method
    const paymentMethodMap = {
      credit_card: "credit_card",
      debit_card: "credit_card",
      bank_account: "bank_transfer",
      e_wallet: "bank_transfer",
      cod: "cod",
    };
    const orderPaymentMethod = paymentMethodMap[paymentMethod.type] || "cod";
    setFormData(prev => ({
      ...prev,
      paymentMethod: orderPaymentMethod,
    }));
    setPaymentMethodModalVisible(false);
  };

  const handleSelectCOD = () => {
    setSelectedPaymentMethod(null);
    setFormData(prev => ({
      ...prev,
      paymentMethod: "cod",
    }));
    setPaymentMethodModalVisible(false);
  };

  const handleSelectAddress = () => {
    if (savedAddresses.length === 0) {
      Alert.alert("Thông báo", "Bạn chưa có địa chỉ nào đã lưu. Vui lòng thêm địa chỉ trong mục Profile > Địa chỉ giao hàng");
      return;
    }

    if (savedAddresses.length === 1) {
      // Chỉ có 1 địa chỉ, tự động chọn
      const address = savedAddresses[0];
      setSelectedAddress(address);
      const fullAddress = formatAddress(address);
      setFormData({
        ...formData,
        customerName: address.name || formData.customerName,
        customerPhone: address.phone || formData.customerPhone,
        customerAddress: fullAddress,
      });
      return;
    }

    // Có nhiều địa chỉ, hiển thị danh sách để chọn
    Alert.alert(
      "Chọn địa chỉ giao hàng",
      "Chọn địa chỉ từ danh sách đã lưu:",
      [
        ...savedAddresses.map((addr, index) => ({
          text: `${addr.is_default ? "⭐ " : ""}${addr.name} - ${addr.city}`,
          onPress: () => {
            setSelectedAddress(addr);
            const fullAddress = formatAddress(addr);
            setFormData({
              ...formData,
              customerName: addr.name || formData.customerName,
              customerPhone: addr.phone || formData.customerPhone,
              customerAddress: fullAddress,
            });
          },
        })),
        { text: "Hủy", style: "cancel" },
      ]
    );
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mã voucher");
      return;
    }

    try {
      setValidatingVoucher(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập để sử dụng voucher");
        return;
      }

      setAuthToken(token);
      const subtotal = calculateSubTotal();
      const response = await API.post("/auth/users/me/vouchers/validate", {
        code: voucherCode.trim(),
        order_total: subtotal,
      });

      if (response.data?.success) {
        setAppliedVoucher(response.data.data);
        setVoucherDiscount(response.data.discountAmount || 0);
        Alert.alert("Thành công", "Áp dụng voucher thành công!");
      } else {
        throw new Error(response.data?.message || "Không thể áp dụng voucher");
      }
    } catch (error) {
      console.error("Error applying voucher:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Mã voucher không hợp lệ";
      Alert.alert("Lỗi", errorMessage);
      setAppliedVoucher(null);
      setVoucherDiscount(0);
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherDiscount(0);
    setVoucherCode("");
  };

  const fetchAvailableVouchers = async () => {
    try {
      setLoadingVouchers(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setAvailableVouchers([]);
        return;
      }

      setAuthToken(token);
      const response = await API.get("/auth/users/me/vouchers");
      const subtotal = calculateSubTotal();

      if (response.data?.success) {
        // Filter chỉ lấy voucher active và đáp ứng điều kiện
        const vouchers = response.data.data || [];
        const available = vouchers.filter((v) => {
          if (v.status !== "active") return false;
          if (v.min_order_value > 0 && subtotal < v.min_order_value) return false;
          return true;
        });
        
        // Tính discount amount cho mỗi voucher
        const vouchersWithDiscount = available.map((v) => {
          let discountAmount = 0;
          if (v.discount_type === "percentage") {
            discountAmount = (subtotal * v.discount_value) / 100;
            if (v.max_discount && discountAmount > v.max_discount) {
              discountAmount = v.max_discount;
            }
          } else {
            discountAmount = v.discount_value;
          }
          return { ...v, discountAmount };
        });

        setAvailableVouchers(vouchersWithDiscount);
      }
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      setAvailableVouchers([]);
      // Không hiển thị alert để tránh làm phiền user
    } finally {
      setLoadingVouchers(false);
    }
  };

  const handleOpenVoucherModal = () => {
    setVoucherModalVisible(true);
    fetchAvailableVouchers();
  };

  const handleSelectVoucher = async (voucher) => {
    try {
      setValidatingVoucher(true);
      const subtotal = calculateSubTotal();
      const token = await AsyncStorage.getItem("token");
      
      if (!token) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập để sử dụng voucher");
        return;
      }

      setAuthToken(token);

      const response = await API.post("/auth/users/me/vouchers/validate", {
        code: voucher.code,
        order_total: subtotal,
      });

      if (response.data?.success) {
        setAppliedVoucher(response.data.data);
        setVoucherDiscount(response.data.discountAmount || voucher.discountAmount || 0);
        setVoucherCode(voucher.code);
        setVoucherModalVisible(false);
      } else {
        throw new Error(response.data?.message || "Không thể áp dụng voucher");
      }
    } catch (error) {
      console.error("Error applying voucher:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Mã voucher không hợp lệ";
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setValidatingVoucher(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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
      
      // Nếu đã chọn địa chỉ từ danh sách đã lưu, dùng thông tin từ đó
      let customerData = {
        name: formData.customerName,
        email: formData.customerEmail,
        phone: formData.customerPhone,
        address: formData.customerAddress,
      };

      // Nếu có địa chỉ đã chọn, dùng thông tin chi tiết từ đó
      if (selectedAddress) {
        customerData = {
          name: selectedAddress.name || formData.customerName,
          email: formData.customerEmail,
          phone: selectedAddress.phone || formData.customerPhone,
          address: formatAddress(selectedAddress) || formData.customerAddress,
        };
      }
      
      // Tạo đơn hàng
      console.log("🛒 CheckoutScreen - cartItems:", JSON.stringify(cartItems, null, 2));
      
      const orderData = {
        customer: customerData,
        items: cartItems.map(item => {
          const orderItem = {
            product_id: item.product_id?._id || item.product_id,
            quantity: item.quantity,
            price: item.price_at_time || item.price || item.product_id?.price || 0,
            variation: item.variation || {},
          };
          console.log("🛒 Order item:", JSON.stringify(orderItem, null, 2));
          return orderItem;
        }),
        payment_method: formData.paymentMethod,
        notes: formData.notes,
        total_amount: calculateTotal(),
        status: "pending",
        voucher_id: appliedVoucher?._id || null,
        voucher_code: appliedVoucher?.code || null,
        discount_amount: voucherDiscount || 0,
      };

      // Gửi đơn hàng lên server - gửi token nếu user đã đăng nhập
      const token = await AsyncStorage.getItem("token");
      const config = {};
      
      if (token) {
        // Gửi token trực tiếp trong request config để đảm bảo header được gửi
        config.headers = {
          Authorization: `Bearer ${token}`
        };
        setAuthToken(token); // Vẫn set cho các request sau
        console.log("🔑 Token set for order creation");
      } else {
        console.log("⚠️ No token found for order creation");
      }
      
      const response = await API.post("/orders", orderData, config);
      
      if (response.data.success) {
        console.log("Order created:", response.data.data);
        
        // Đánh dấu voucher đã sử dụng nếu có
        if (appliedVoucher && response.data.data._id) {
          try {
            await API.put(`/auth/users/me/vouchers/${appliedVoucher._id}/use`, {
              order_id: response.data.data._id,
            });
            console.log("Voucher marked as used");
          } catch (voucherError) {
            console.error("Error marking voucher as used:", voucherError);
            // Không block đơn hàng nếu lỗi đánh dấu voucher
          }
        }
      } else {
        throw new Error(response.data.message || "Không thể tạo đơn hàng");
      }
      
      // Clear cart and form data
      await AsyncStorage.removeItem("guestCart");
      await AsyncStorage.removeItem("checkoutFormData");
      
      // Clear voucher
      setAppliedVoucher(null);
      setVoucherDiscount(0);
      setVoucherCode("");
      
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
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Thanh toán</Text>
        </View>
        <View style={styles.placeholder} />
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
            </View>
            
            {/* Voucher Section */}
            <View style={styles.voucherSection}>
              <View style={styles.voucherSectionHeader}>
                <Text style={styles.voucherSectionTitle}>Mã giảm giá</Text>
                {!appliedVoucher && (
                  <TouchableOpacity
                    style={styles.selectVoucherButton}
                    onPress={handleOpenVoucherModal}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.selectVoucherButtonText}>Chọn voucher</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {!appliedVoucher ? (
                <View style={styles.voucherInputContainer}>
                  <TextInput
                    style={styles.voucherInput}
                    value={voucherCode}
                    onChangeText={setVoucherCode}
                    placeholder="Nhập mã voucher"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    style={[styles.applyVoucherButton, validatingVoucher && styles.applyVoucherButtonDisabled]}
                    onPress={handleApplyVoucher}
                    disabled={validatingVoucher || !voucherCode.trim()}
                  >
                    <Text style={styles.applyVoucherButtonText}>
                      {validatingVoucher ? "..." : "Áp dụng"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.appliedVoucherContainer}>
                  <View style={styles.appliedVoucherInfo}>
                    <Text style={styles.appliedVoucherCode}>
                      ✓ {appliedVoucher.code}
                    </Text>
                    <Text style={styles.appliedVoucherDiscount}>
                      -{voucherDiscount.toLocaleString("vi-VN")}đ
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeVoucherButton}
                    onPress={handleRemoveVoucher}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeVoucherButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Price Breakdown */}
            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Tạm tính:</Text>
                <Text style={styles.priceValue}>
                  {calculateSubTotal().toLocaleString("vi-VN")}đ
                </Text>
              </View>
              {appliedVoucher && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Giảm giá:</Text>
                  <Text style={[styles.priceValue, styles.discountValue]}>
                    -{voucherDiscount.toLocaleString("vi-VN")}đ
                  </Text>
                </View>
              )}
              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Tổng cộng:</Text>
                <Text style={styles.totalAmount}>
                  {calculateTotal().toLocaleString("vi-VN")}đ
                </Text>
              </View>
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
              <View style={styles.addressHeader}>
                <Text style={styles.label}>Địa chỉ giao hàng *</Text>
                {savedAddresses.length > 0 && (
                  <TouchableOpacity
                    style={styles.selectAddressButton}
                    onPress={handleSelectAddress}
                  >
                    <Text style={styles.selectAddressButtonText}>
                      📍 Chọn từ địa chỉ đã lưu
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {selectedAddress && (
                <View style={styles.selectedAddressBadge}>
                  <Text style={styles.selectedAddressText} numberOfLines={1}>
                    ✓ Đang dùng: {selectedAddress.name} - {selectedAddress.city}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedAddress(null);
                      handleInputChange("customerAddress", "");
                    }}
                  >
                    <Text style={styles.clearAddressText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.customerAddress}
                onChangeText={(value) => {
                  handleInputChange("customerAddress", value);
                  // Nếu user tự nhập, bỏ chọn địa chỉ đã lưu
                  if (selectedAddress && value !== formatAddress(selectedAddress)) {
                    setSelectedAddress(null);
                  }
                }}
                placeholder="Nhập địa chỉ giao hàng chi tiết"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
              {savedPaymentMethods.length > 0 && (
                <TouchableOpacity
                  onPress={() => setPaymentMethodModalVisible(true)}
                  style={styles.selectButton}
                >
                  <Text style={styles.selectButtonText}>Chọn phương thức</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.paymentOptions}>
              {/* Hiển thị payment method đã chọn */}
              {selectedPaymentMethod ? (
                <TouchableOpacity
                  style={[styles.paymentOption, styles.paymentOptionSelected]}
                  onPress={() => setPaymentMethodModalVisible(true)}
                >
                  <View style={styles.paymentMethodInfo}>
                    <Text style={styles.paymentMethodIcon}>
                      {getPaymentMethodIcon(selectedPaymentMethod.type)}
                    </Text>
                    <View style={styles.paymentMethodDetails}>
                      <View style={styles.paymentMethodTitleRow}>
                        <Text style={styles.paymentMethodType}>
                          {getPaymentMethodLabel(selectedPaymentMethod.type)}
                        </Text>
                        {selectedPaymentMethod.is_default && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Mặc định</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.paymentMethodProvider}>
                        {selectedPaymentMethod.provider}
                      </Text>
                      {selectedPaymentMethod.card_number && (
                        <Text style={styles.paymentMethodNumber}>
                          {selectedPaymentMethod.card_number}
                        </Text>
                      )}
                      {selectedPaymentMethod.account_number && (
                        <Text style={styles.paymentMethodNumber}>
                          {selectedPaymentMethod.account_number}
                        </Text>
                      )}
                      {selectedPaymentMethod.wallet_id && (
                        <Text style={styles.paymentMethodNumber}>
                          ID: {selectedPaymentMethod.wallet_id}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    formData.paymentMethod === "cod" && styles.paymentOptionSelected
                  ]}
                  onPress={handleSelectCOD}
                >
                  <Text style={[
                    styles.paymentOptionText,
                    formData.paymentMethod === "cod" && styles.paymentOptionTextSelected
                  ]}>
                    💰 Thanh toán khi nhận hàng (COD)
                  </Text>
                </TouchableOpacity>
              )}
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

      {/* Voucher Selection Modal */}
      <Modal
        visible={voucherModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVoucherModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn voucher</Text>
              <TouchableOpacity
                onPress={() => setVoucherModalVisible(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingVouchers ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color="#ef4444" />
                <Text style={styles.modalLoadingText}>Đang tải...</Text>
              </View>
            ) : availableVouchers.length === 0 ? (
              <View style={styles.modalEmptyContainer}>
                <Text style={styles.modalEmptyIcon}>🎫</Text>
                <Text style={styles.modalEmptyText}>Không có voucher khả dụng</Text>
                <Text style={styles.modalEmptySubtext}>
                  Voucher sẽ được hiển thị ở đây khi bạn có voucher phù hợp với đơn hàng
                </Text>
              </View>
            ) : (
              <FlatList
                data={availableVouchers}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.voucherModalItem}
                    onPress={() => handleSelectVoucher(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.voucherModalItemLeft}>
                      <View style={styles.voucherModalDiscount}>
                        <Text style={styles.voucherModalDiscountValue}>
                          {item.discount_type === "percentage"
                            ? `${item.discount_value}%`
                            : `${item.discount_value.toLocaleString("vi-VN")}đ`}
                        </Text>
                      </View>
                      <View style={styles.voucherModalInfo}>
                        <Text style={styles.voucherModalName}>{item.name}</Text>
                        {item.description && (
                          <Text style={styles.voucherModalDescription} numberOfLines={1}>
                            {item.description}
                          </Text>
                        )}
                        {item.min_order_value > 0 && (
                          <Text style={styles.voucherModalCondition}>
                            Đơn tối thiểu: {item.min_order_value.toLocaleString("vi-VN")}đ
                          </Text>
                        )}
                        <Text style={styles.voucherModalCode}>Mã: {item.code}</Text>
                      </View>
                    </View>
                    <View style={styles.voucherModalRight}>
                      <Text style={styles.voucherModalSave}>
                        Tiết kiệm{"\n"}
                        {item.discountAmount.toLocaleString("vi-VN")}đ
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.modalListContent}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Payment Method Selection Modal */}
      <Modal
        visible={paymentMethodModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPaymentMethodModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn phương thức thanh toán</Text>
              <TouchableOpacity
                onPress={() => setPaymentMethodModalVisible(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={[
                { id: "cod", type: "cod", provider: "Thanh toán khi nhận hàng", is_default: false },
                ...savedPaymentMethods,
              ]}
              keyExtractor={(item) => item.id || item._id}
              renderItem={({ item }) => {
                const isCOD = item.id === "cod";
                const isSelected = isCOD
                  ? !selectedPaymentMethod && formData.paymentMethod === "cod"
                  : selectedPaymentMethod?._id === item._id;

                return (
                  <TouchableOpacity
                    style={[
                      styles.paymentMethodModalItem,
                      isSelected && styles.paymentMethodModalItemSelected,
                    ]}
                    onPress={() => {
                      if (isCOD) {
                        handleSelectCOD();
                      } else {
                        handleSelectPaymentMethod(item);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.paymentMethodModalItemLeft}>
                      <Text style={styles.paymentMethodModalIcon}>
                        {getPaymentMethodIcon(item.type)}
                      </Text>
                      <View style={styles.paymentMethodModalInfo}>
                        <View style={styles.paymentMethodModalTitleRow}>
                          <Text style={styles.paymentMethodModalType}>
                            {getPaymentMethodLabel(item.type)}
                          </Text>
                          {item.is_default && (
                            <View style={styles.modalDefaultBadge}>
                              <Text style={styles.modalDefaultBadgeText}>Mặc định</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.paymentMethodModalProvider}>
                          {item.provider}
                        </Text>
                        {item.card_number && (
                          <Text style={styles.paymentMethodModalNumber}>
                            {item.card_number}
                          </Text>
                        )}
                        {item.account_number && (
                          <Text style={styles.paymentMethodModalNumber}>
                            {item.account_number}
                          </Text>
                        )}
                        {item.wallet_id && (
                          <Text style={styles.paymentMethodModalNumber}>
                            ID: {item.wallet_id}
                          </Text>
                        )}
                      </View>
                    </View>
                    {isSelected && (
                      <View style={styles.paymentMethodModalCheck}>
                        <Text style={styles.paymentMethodModalCheckText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.modalListContent}
              ListFooterComponent={
                <TouchableOpacity
                  style={styles.addPaymentMethodButton}
                  onPress={() => {
                    setPaymentMethodModalVisible(false);
                    navigation.navigate("PaymentMethods");
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addPaymentMethodButtonText}>
                    + Thêm phương thức thanh toán mới
                  </Text>
                </TouchableOpacity>
              }
            />
          </View>
        </View>
      </Modal>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 40,
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
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  selectButton: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  selectButtonText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "700",
  },
  autoFillNotice: {
    color: "#10b981",
    fontSize: 13,
    marginBottom: 16,
    fontWeight: "600",
    backgroundColor: "#10b98120",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#10b98140",
  },
  orderSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  voucherSection: {
    marginTop: 12,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  voucherSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  voucherSectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  selectVoucherButton: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  selectVoucherButtonText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "600",
  },
  voucherInputContainer: {
    flexDirection: "row",
    gap: 8,
  },
  voucherInput: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#333",
  },
  applyVoucherButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  applyVoucherButtonDisabled: {
    opacity: 0.6,
  },
  applyVoucherButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  appliedVoucherContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#10b98120",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10b981",
  },
  appliedVoucherInfo: {
    flex: 1,
  },
  appliedVoucherCode: {
    color: "#10b981",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  appliedVoucherDiscount: {
    color: "#10b981",
    fontSize: 16,
    fontWeight: "bold",
  },
  removeVoucherButton: {
    padding: 4,
  },
  removeVoucherButtonText: {
    color: "#9ca3af",
    fontSize: 18,
    fontWeight: "bold",
  },
  priceBreakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  priceLabel: {
    color: "#9ca3af",
    fontSize: 14,
  },
  priceValue: {
    color: "#fff",
    fontSize: 14,
  },
  discountValue: {
    color: "#10b981",
    fontWeight: "600",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  totalLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  totalAmount: {
    color: "#ef4444",
    fontSize: 20,
    fontWeight: "bold",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: "#d1d5db",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: "#0f0f0f",
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
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
  paymentMethodInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  paymentMethodIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    flexWrap: "wrap",
  },
  paymentMethodType: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  paymentMethodProvider: {
    color: "#d1d5db",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  paymentMethodNumber: {
    color: "#9ca3af",
    fontSize: 13,
    marginBottom: 2,
  },
  paymentMethodModalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  paymentMethodModalItemSelected: {
    borderColor: "#ef4444",
    backgroundColor: "#2a1a1a",
  },
  paymentMethodModalItemLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  paymentMethodModalIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  paymentMethodModalInfo: {
    flex: 1,
  },
  paymentMethodModalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    flexWrap: "wrap",
  },
  paymentMethodModalType: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginRight: 8,
  },
  modalDefaultBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  modalDefaultBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  paymentMethodModalProvider: {
    color: "#d1d5db",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  paymentMethodModalNumber: {
    color: "#9ca3af",
    fontSize: 13,
    marginBottom: 2,
  },
  paymentMethodModalCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  paymentMethodModalCheckText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  addPaymentMethodButton: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  addPaymentMethodButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  placeOrderButton: {
    backgroundColor: "#ef4444",
    margin: 16,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  placeOrderButtonDisabled: {
    backgroundColor: "#666",
    opacity: 0.5,
  },
  placeOrderButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  selectAddressButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#ef4444",
  },
  selectAddressButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  selectedAddressBadge: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a3a1a",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  selectedAddressText: {
    color: "#10b981",
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  clearAddressText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "300",
  },
  modalLoadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalLoadingText: {
    color: "#9ca3af",
    fontSize: 14,
    marginTop: 12,
  },
  modalEmptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalEmptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  modalEmptyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  modalEmptySubtext: {
    color: "#9ca3af",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  modalListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  voucherModalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0f0f0f",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
  },
  voucherModalItemLeft: {
    flexDirection: "row",
    flex: 1,
    gap: 12,
  },
  voucherModalDiscount: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: "#ef444420",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#ef444440",
  },
  voucherModalDiscountValue: {
    color: "#ef4444",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  voucherModalInfo: {
    flex: 1,
  },
  voucherModalName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  voucherModalDescription: {
    color: "#d1d5db",
    fontSize: 12,
    marginBottom: 6,
  },
  voucherModalCondition: {
    color: "#9ca3af",
    fontSize: 11,
    marginBottom: 4,
    fontStyle: "italic",
  },
  voucherModalCode: {
    color: "#6b7280",
    fontSize: 11,
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  voucherModalRight: {
    alignItems: "flex-end",
  },
  voucherModalSave: {
    color: "#10b981",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
    lineHeight: 18,
  },
});
