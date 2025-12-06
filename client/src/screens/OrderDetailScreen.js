import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API, { setAuthToken, orderAPI } from "../services/api";
import { imageUrl } from "../services/image";

export default function OrderDetailScreen({ navigation, route }) {
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (token) {
        setAuthToken(token);
      }

      const response = await orderAPI.getOrderById(orderId);

      if (response.data?.success) {
        setOrder(response.data.data);
      } else {
        throw new Error(response.data?.message || "Không thể tải thông tin đơn hàng");
      }
    } catch (error) {
      console.log("Error details:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin đơn hàng");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "#f59e0b";
      case "processing": return "#3b82f6";
      case "shipped": return "#8b5cf6";
      case "delivered": return "#10b981";
      case "cancelled": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending": return "Chờ xử lý";
      case "processing": return "Đang xử lý";
      case "shipped": return "Đang giao";
      case "delivered": return "Đã giao";
      case "cancelled": return "Đã hủy";
      default: return "Không xác định";
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case "cod": return "Thanh toán khi nhận hàng";
      case "bank_transfer": return "Chuyển khoản ngân hàng";
      case "credit_card": return "Thẻ tín dụng";
      default: return method;
    }
  };

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
          <Text style={styles.title}>Chi tiết đơn hàng</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Quay lại</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Chi tiết đơn hàng</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không tìm thấy đơn hàng</Text>
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
          <Text style={styles.title}>Chi tiết đơn hàng</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Info Card */}
        <View style={styles.card}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>
              Đơn #{order.order_number || order._id.slice(-6)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
            </View>
          </View>
          <Text style={styles.orderDate}>
            Ngày đặt: {new Date(order.createdAt || order.order_date).toLocaleString('vi-VN')}
          </Text>
        </View>

        {/* Delivery Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Người nhận:</Text>
            <Text style={styles.infoValue}>{order.customer?.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số điện thoại:</Text>
            <Text style={styles.infoValue}>{order.customer?.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{order.customer?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Địa chỉ:</Text>
            <Text style={styles.infoValue}>{order.customer?.address}</Text>
          </View>
        </View>

        {/* Products List */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sản phẩm ({order.items?.length || 0})</Text>
          {order.items?.map((item, index) => {
            const product = item.product_id;
            // Kiểm tra nhiều trường có thể có của image
            const productImagePath = product?.imageUrl || product?.image_url || product?.images?.[0];
            const fullImageUrl = productImagePath ? imageUrl(productImagePath) : null;
            
            return (
              <View key={index} style={styles.productItem}>
                <Image
                  source={
                    fullImageUrl
                      ? { uri: fullImageUrl }
                      : require("../../assets/icon.png")
                  }
                  style={styles.productImage}
                  resizeMode="cover"
                  defaultSource={require("../../assets/icon.png")}
                  onError={() => console.log("Image error for product:", product?._id)}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product?.name || "Sản phẩm"}
                  </Text>
                  <Text style={styles.productPrice}>
                    {item.price.toLocaleString('vi-VN')}đ
                  </Text>
                  <Text style={styles.productQuantity}>
                    Số lượng: {item.quantity}
                  </Text>
                </View>
                <View style={styles.productTotal}>
                  <Text style={styles.productTotalText}>
                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Payment Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phương thức:</Text>
            <Text style={styles.infoValue}>
              {getPaymentMethodText(order.payment_method)}
            </Text>
          </View>
          {order.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ghi chú:</Text>
              <Text style={styles.infoValue}>{order.notes}</Text>
            </View>
          )}
        </View>

        {/* Total Amount */}
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng:</Text>
            <Text style={styles.totalAmount}>
              {(order.total_amount || 0).toLocaleString('vi-VN')}đ
            </Text>
          </View>
        </View>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderNumber: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  orderDate: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "500",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 18,
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 14,
    flexWrap: "wrap",
  },
  infoLabel: {
    color: "#9ca3af",
    fontSize: 14,
    width: 110,
    fontWeight: "600",
  },
  infoValue: {
    color: "#d1d5db",
    fontSize: 14,
    flex: 1,
    fontWeight: "500",
  },
  productItem: {
    flexDirection: "row",
    marginBottom: 18,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  productInfo: {
    flex: 1,
    marginRight: 10,
  },
  productName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  productPrice: {
    color: "#9ca3af",
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "500",
  },
  productQuantity: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "500",
  },
  productTotal: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  productTotalText: {
    color: "#ef4444",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: "#2a2a2a",
  },
  totalLabel: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  totalAmount: {
    color: "#ef4444",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
