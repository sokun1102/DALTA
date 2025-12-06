import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
  TextInput,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API, { setAuthToken, orderAPI } from "../services/api";

export default function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Chưa đăng nhập", "Vui lòng đăng nhập để xem lịch sử mua hàng");
        navigation.goBack();
        return;
      }

      setAuthToken(token);
      console.log("📤 Fetching orders for user with token:", token ? "Present" : "Missing");
      const response = await orderAPI.getMyOrders();
      
      console.log("📥 API Response:", response.data);
      console.log("📦 Orders count:", response.data?.data?.length || 0);

      if (response.data?.success) {
        setOrders(response.data.data || []);
        if (response.data.data?.length === 0) {
          console.log("⚠️ No orders found for this user");
        }
      } else {
        throw new Error(response.data?.message || "Không thể tải đơn hàng");
      }
    } catch (error) {
      console.log("Error details:", error);
      Alert.alert("Lỗi", "Không thể tải lịch sử mua hàng");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyOrders();
    setRefreshing(false);
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

  // Filter và search orders
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Filter theo status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    // Search theo số đơn hàng hoặc tên sản phẩm
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(order => {
        // Tìm theo số đơn hàng
        const orderNumber = (order.order_number || order._id.slice(-6)).toLowerCase();
        if (orderNumber.includes(query)) return true;

        // Tìm theo tên sản phẩm trong items
        if (order.items && order.items.length > 0) {
          return order.items.some(item => {
            const product = item.product_id;
            if (product && product.name) {
              return product.name.toLowerCase().includes(query);
            }
            return false;
          });
        }
        return false;
      });
    }

    return filtered;
  }, [orders, selectedStatus, searchQuery]);

  const statusFilters = [
    { key: "all", label: "Tất cả" },
    { key: "pending", label: "Chờ xử lý" },
    { key: "processing", label: "Đang xử lý" },
    { key: "shipped", label: "Đang giao" },
    { key: "delivered", label: "Đã giao" },
    { key: "cancelled", label: "Đã hủy" },
  ];

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderItem}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>
          Đơn #{item.order_number || item._id.slice(-6)}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.itemCount}>
          {(item.items || []).length} sản phẩm
        </Text>
        <Text style={styles.totalAmount}>
          {(item.total_amount || 0).toLocaleString('vi-VN')}đ
        </Text>
      </View>

      <Text style={styles.orderDate}>
        {new Date(item.createdAt || item.order_date).toLocaleDateString('vi-VN')}
      </Text>
      
      <View style={styles.viewDetailButton}>
        <Text style={styles.viewDetailText}>Xem chi tiết</Text>
        <Text style={styles.viewDetailArrow}>›</Text>
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.title}>Lịch sử đơn hàng</Text>
          <Text style={styles.headerSubtitle}>{orders.length} đơn hàng</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchWrapper}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm đơn hàng..."
                placeholderTextColor="#6b7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Status Filters */}
          <View style={styles.filtersWrapper}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContent}
            >
              {statusFilters.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterButton,
                    selectedStatus === filter.key && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedStatus(filter.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedStatus === filter.key && styles.filterButtonTextActive
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={filteredOrders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.ordersList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery || selectedStatus !== "all" 
                    ? "Không tìm thấy đơn hàng phù hợp" 
                    : "Bạn chưa có đơn hàng nào"}
                </Text>
              </View>
            }
          />
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
  headerSubtitle: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  placeholder: {
    width: 40,
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
  ordersList: {
    padding: 16,
  },
  orderItem: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
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
    marginBottom: 14,
  },
  orderNumber: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
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
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  itemCount: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "500",
  },
  totalAmount: {
    color: "#ef4444",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  orderDate: {
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 10,
    fontWeight: "500",
  },
  viewDetailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  viewDetailText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginRight: 4,
  },
  viewDetailArrow: {
    color: "#ef4444",
    fontSize: 18,
    fontWeight: "bold",
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
  filtersWrapper: {
    backgroundColor: "#0a0a0a",
    paddingVertical: 12,
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "#1a1a1a",
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
    shadowColor: "#ef4444",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  filterButtonText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  filterButtonTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
});
