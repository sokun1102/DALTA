import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API, { setAuthToken } from "../services/api";

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    checkUserRole();
    fetchOrders();
  }, []);

  const checkUserRole = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Chưa đăng nhập", "Vui lòng đăng nhập để xem đơn hàng");
        navigation.goBack();
        return;
      }

      setAuthToken(token);
      const meRes = await API.get("/auth/users/me");
      const currentUser = meRes?.data?.data;
      setUserRole(currentUser?.role || "user");
      
      if (currentUser?.role !== "admin") {
        Alert.alert("Không có quyền", "Chỉ admin mới có thể xem tất cả đơn hàng");
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert("Lỗi", "Không thể kiểm tra quyền người dùng");
      navigation.goBack();
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const user = await AsyncStorage.getItem("user");
      if (!token || !user) {
        throw new Error("Unauthorized");
      }

      setAuthToken(token);
      // Lấy danh sách tất cả đơn hàng (admin)
      const response = await API.get("/orders");
      console.log("Orders response:", response.data);
      
      if (response.data && response.data.success) {
        setOrders(response.data.data || []);
      } else {
        console.error("Invalid response:", response.data);
        setOrders([]);
      }
    } catch (error) {
      console.log("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      Alert.alert("Lỗi", "Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = await AsyncStorage.getItem("token");
      setAuthToken(token);
      
      await API.put(`/orders/${orderId}/status`, { status: newStatus });
      await fetchOrders();
      Alert.alert("Thành công", "Đã cập nhật trạng thái đơn hàng");
    } catch (error) {
      console.error("Error updating order status:", error);
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái đơn hàng");
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
      case "shipped": return "Đã giao hàng";
      case "delivered": return "Hoàn thành";
      case "cancelled": return "Đã hủy";
      default: return status;
    }
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>
          #{item.order_number || item._id.slice(-6)}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.customer.name}</Text>
        <Text style={styles.customerContact}>{item.customer.email}</Text>
        <Text style={styles.customerContact}>{item.customer.phone}</Text>
      </View>
      
      <View style={styles.orderDetails}>
        <Text style={styles.itemCount}>
          {item.items.length} sản phẩm
        </Text>
        <Text style={styles.totalAmount}>
          {item.total_amount.toLocaleString("vi-VN")}đ
        </Text>
      </View>
      
      <Text style={styles.orderDate}>
        {new Date(item.createdAt).toLocaleDateString("vi-VN")} - {new Date(item.createdAt).toLocaleTimeString("vi-VN")}
      </Text>
      
      <View style={styles.actionButtons}>
        {item.status === "pending" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.processButton]}
            onPress={() => updateOrderStatus(item._id, "processing")}
          >
            <Text style={styles.actionButtonText}>Xử lý</Text>
          </TouchableOpacity>
        )}
        
        {item.status === "processing" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.shipButton]}
            onPress={() => updateOrderStatus(item._id, "shipped")}
          >
            <Text style={styles.actionButtonText}>Giao hàng</Text>
          </TouchableOpacity>
        )}
        
        {item.status === "shipped" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deliverButton]}
            onPress={() => updateOrderStatus(item._id, "delivered")}
          >
            <Text style={styles.actionButtonText}>Hoàn thành</Text>
          </TouchableOpacity>
        )}
        
        {(item.status === "pending" || item.status === "processing") && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => updateOrderStatus(item._id, "cancelled")}
          >
            <Text style={styles.actionButtonText}>Hủy</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (userRole !== "admin") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Quay lại</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Quản lý đơn hàng</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Bạn không có quyền truy cập trang này</Text>
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
        <Text style={styles.title}>Quản lý đơn hàng</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchOrders}
        >
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          style={styles.ordersList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
            </View>
          }
        />
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
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 18,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    textAlign: "center",
  },
  ordersList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  orderItem: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderNumber: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  customerInfo: {
    marginBottom: 12,
  },
  customerName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  customerContact: {
    color: "#9ca3af",
    fontSize: 12,
    marginBottom: 2,
  },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemCount: {
    color: "#9ca3af",
    fontSize: 12,
  },
  totalAmount: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "bold",
  },
  orderDate: {
    color: "#6b7280",
    fontSize: 11,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  processButton: {
    backgroundColor: "#3b82f6",
  },
  shipButton: {
    backgroundColor: "#8b5cf6",
  },
  deliverButton: {
    backgroundColor: "#10b981",
  },
  cancelButton: {
    backgroundColor: "#ef4444",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
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
});
