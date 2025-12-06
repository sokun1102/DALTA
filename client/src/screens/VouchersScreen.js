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
  ActivityIndicator,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API, { setAuthToken } from "../services/api";

export default function VouchersScreen({ navigation }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [creatingSample, setCreatingSample] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Chưa đăng nhập", "Vui lòng đăng nhập để xem voucher");
        navigation.goBack();
        return;
      }

      setAuthToken(token);
      const response = await API.get("/auth/users/me/vouchers");

      if (response.data?.success) {
        const vouchersData = response.data.data || [];
        setVouchers(vouchersData);
        setError(null);
      } else {
        throw new Error(response.data?.message || "Không thể tải voucher");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Không thể tải danh sách voucher";
      Alert.alert("Lỗi", errorMessage);
      setVouchers([]);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVouchers();
    setRefreshing(false);
  };

  const handleCreateSampleVouchers = async (resetFirst = false) => {
    try {
      setCreatingSample(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập");
        return;
      }

      setAuthToken(token);
      
      if (resetFirst && vouchers.length > 0) {
        try {
          await API.delete("/auth/users/me/vouchers/all");
        } catch (error) {
          console.error("Error deleting vouchers:", error);
        }
      }

      const response = await API.post("/auth/users/me/vouchers/sample");
      
      if (response.data?.success) {
        Alert.alert("Thành công", response.data.message || `Đã tạo ${response.data.data?.length || 0} voucher mẫu`);
        setError(null);
        await fetchVouchers();
      } else {
        throw new Error(response.data?.message || "Không thể tạo voucher");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Không thể tạo voucher mẫu";
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setCreatingSample(false);
    }
  };

  const getFilteredVouchers = () => {
    if (filter === "all") return vouchers;
    return vouchers.filter((v) => v.status === filter);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "active":
        return {
          color: "#10b981",
          bgColor: "#10b98120",
          borderColor: "#10b98150",
          icon: "✓",
          gradient: ["#10b981", "#059669"],
        };
      case "used":
        return {
          color: "#6b7280",
          bgColor: "#6b728020",
          borderColor: "#6b728050",
          icon: "○",
          gradient: ["#6b7280", "#4b5563"],
        };
      case "expired":
        return {
          color: "#ef4444",
          bgColor: "#ef444420",
          borderColor: "#ef444450",
          icon: "✕",
          gradient: ["#ef4444", "#dc2626"],
        };
      case "pending":
        return {
          color: "#f59e0b",
          bgColor: "#f59e0b20",
          borderColor: "#f59e0b50",
          icon: "⏱",
          gradient: ["#f59e0b", "#d97706"],
        };
      case "exhausted":
        return {
          color: "#9ca3af",
          bgColor: "#9ca3af20",
          borderColor: "#9ca3af50",
          icon: "⊘",
          gradient: ["#9ca3af", "#6b7280"],
        };
      default:
        return {
          color: "#6b7280",
          bgColor: "#6b728020",
          borderColor: "#6b728050",
          icon: "○",
          gradient: ["#6b7280", "#4b5563"],
        };
    }
  };

  const copyToClipboard = (code) => {
    Alert.alert(
      "Mã voucher",
      `Mã voucher: ${code}\n\nVui lòng copy mã này khi thanh toán`,
      [{ text: "OK" }]
    );
  };

  const renderVoucherItem = ({ item }) => {
    const isActive = item.status === "active";
    const statusConfig = getStatusConfig(item.status);

    return (
      <View style={styles.voucherCardWrapper}>
        {/* Active indicator border */}
        {isActive && (
          <View style={[styles.activeBorderLeft, { backgroundColor: statusConfig.color }]} />
        )}
        
        <View
          style={[
            styles.voucherCard,
            !isActive && styles.voucherCardDisabled,
            isActive && { borderColor: statusConfig.borderColor },
          ]}
        >
          {/* Status Badge */}
          <View style={styles.voucherHeader}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor, borderColor: statusConfig.borderColor }]}>
              <Text style={[styles.statusIcon, { color: statusConfig.color }]}>
                {statusConfig.icon}
              </Text>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {item.statusText}
              </Text>
            </View>
            {item.is_used && item.order_id && (
              <View style={styles.usedOrderBadge}>
                <Text style={styles.usedOrderText}>
                  Đơn #{item.order_id.order_number}
                </Text>
              </View>
            )}
          </View>

          {/* Discount Value - Prominent */}
          <View style={styles.discountSection}>
            <View style={styles.discountMain}>
              <Text style={[styles.discountValue, { color: statusConfig.color }]}>
                {item.discount_type === "percentage"
                  ? `${item.discount_value}%`
                  : `${item.discount_value.toLocaleString("vi-VN")}`}
              </Text>
              {item.discount_type === "fixed_amount" && (
                <Text style={[styles.discountUnit, { color: statusConfig.color }]}>đ</Text>
              )}
            </View>
            {item.discount_type === "percentage" && item.max_discount && (
              <Text style={styles.maxDiscount}>
                Tối đa {item.max_discount.toLocaleString("vi-VN")}đ
              </Text>
            )}
          </View>

          {/* Voucher Info */}
          <View style={styles.voucherInfoSection}>
            <Text style={styles.voucherName}>{item.name}</Text>
            
            {item.description && (
              <Text style={styles.voucherDescription}>{item.description}</Text>
            )}

            {/* Details */}
            <View style={styles.detailsContainer}>
              {item.min_order_value > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Đơn tối thiểu</Text>
                  <Text style={styles.detailValue}>
                    {item.min_order_value.toLocaleString("vi-VN")}đ
                  </Text>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Hiệu lực</Text>
                <Text style={styles.detailValue}>
                  {formatDate(item.start_date)} - {formatDate(item.end_date)}
                </Text>
              </View>

              {item.usage_limit > 1 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sử dụng</Text>
                  <Text style={styles.detailValue}>
                    {item.used_count}/{item.usage_limit} lần
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Voucher Code Footer */}
          <View style={styles.voucherFooter}>
            <View style={styles.codeSection}>
              <View style={styles.codeDisplay}>
                <Text style={styles.codePrefix}>Mã:</Text>
                <Text style={[styles.codeText, !isActive && styles.codeTextDisabled]}>
                  {item.code}
                </Text>
              </View>
              {isActive && (
                <TouchableOpacity
                  style={[styles.copyButton, { backgroundColor: statusConfig.color }]}
                  onPress={() => copyToClipboard(item.code)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.copyButtonText}>Sao chép</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const filterButtons = [
    { key: "all", label: "Tất cả", icon: "📋" },
    { key: "active", label: "Có thể dùng", icon: "✅" },
    { key: "used", label: "Đã dùng", icon: "✓" },
    { key: "expired", label: "Hết hạn", icon: "⏰" },
  ];

  const filteredVouchers = getFilteredVouchers();
  const counts = {
    all: vouchers.length,
    active: vouchers.filter((v) => v.status === "active").length,
    used: vouchers.filter((v) => v.status === "used").length,
    expired: vouchers.filter((v) => v.status === "expired").length,
  };

  if (loading) {
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
            <Text style={styles.headerTitle}>Voucher của tôi</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Đang tải voucher...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Voucher của tôi</Text>
          {vouchers.length > 0 && (
            <Text style={styles.headerSubtitle}>{vouchers.length} voucher</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => handleCreateSampleVouchers(true)}
          disabled={creatingSample}
          activeOpacity={0.7}
        >
          {creatingSample ? (
            <ActivityIndicator color="#ef4444" size="small" />
          ) : (
            <Text style={styles.resetButtonText}>Reset</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {filterButtons.map((btn) => (
            <TouchableOpacity
              key={btn.key}
              style={[
                styles.filterButton,
                filter === btn.key && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(btn.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.filterIcon}>{btn.icon}</Text>
              <Text
                style={[
                  styles.filterButtonText,
                  filter === btn.key && styles.filterButtonTextActive,
                ]}
              >
                {btn.label}
              </Text>
              {counts[btn.key] > 0 && (
                <View style={[
                  styles.filterBadge,
                  filter === btn.key && styles.filterBadgeActive
                ]}>
                  <Text style={[
                    styles.filterBadgeText,
                    filter === btn.key && styles.filterBadgeTextActive
                  ]}>
                    {counts[btn.key]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Vouchers List */}
      {filteredVouchers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyIcon}>🎫</Text>
          </View>
          <Text style={styles.emptyTitle}>
            {filter === "all"
              ? "Chưa có voucher nào"
              : `Chưa có voucher ${filterButtons.find((b) => b.key === filter)?.label.toLowerCase()}`}
          </Text>
          <Text style={styles.emptySubtext}>
            {filter === "all"
              ? "Bạn có thể tạo voucher mẫu để test hoặc nhận voucher từ hệ thống"
              : "Voucher sẽ được hiển thị ở đây khi bạn nhận được"}
          </Text>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {filter === "all" && (
            <TouchableOpacity
              style={[
                styles.createSampleButton,
                creatingSample && styles.createSampleButtonDisabled,
              ]}
              onPress={handleCreateSampleVouchers}
              disabled={creatingSample}
              activeOpacity={0.8}
            >
              {creatingSample ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.createSampleButtonText}>Tạo voucher mẫu</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredVouchers}
          renderItem={renderVoucherItem}
          keyExtractor={(item, index) => item._id || item.code || `voucher-${index}`}
          contentContainerStyle={styles.vouchersList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ef4444"
              colors={["#ef4444"]}
            />
          }
          showsVerticalScrollIndicator={false}
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#000",
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
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ef4444",
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButtonText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    marginTop: 12,
    fontSize: 16,
  },
  filterWrapper: {
    backgroundColor: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
    marginRight: 8,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterIcon: {
    fontSize: 14,
  },
  filterButtonText: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  filterButtonTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  filterBadge: {
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  filterBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  filterBadgeTextActive: {
    color: "#ffffff",
  },
  vouchersList: {
    padding: 16,
    paddingBottom: 32,
  },
  voucherCardWrapper: {
    marginBottom: 16,
    position: "relative",
  },
  activeBorderLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    zIndex: 1,
  },
  voucherCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },
  voucherCardDisabled: {
    opacity: 0.6,
    borderColor: "#1a1a1a",
  },
  voucherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  statusIcon: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  usedOrderBadge: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  usedOrderText: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "600",
  },
  discountSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  discountMain: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 6,
  },
  discountValue: {
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -1,
  },
  discountUnit: {
    fontSize: 28,
    fontWeight: "700",
    marginLeft: 4,
  },
  maxDiscount: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "500",
  },
  voucherInfoSection: {
    marginBottom: 20,
  },
  voucherName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  voucherDescription: {
    color: "#d1d5db",
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  detailsContainer: {
    gap: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#0a0a0a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  detailLabel: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "500",
  },
  detailValue: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  voucherFooter: {
    marginTop: 4,
  },
  codeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  codeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: "#0a0a0a",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  codePrefix: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
    marginRight: 10,
  },
  codeText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: "monospace",
  },
  codeTextDisabled: {
    color: "#6b7280",
    opacity: 0.6,
  },
  copyButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 12,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  copyButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  emptySubtext: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  createSampleButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#dc2626",
  },
  createSampleButtonDisabled: {
    opacity: 0.6,
  },
  createSampleButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  errorBox: {
    backgroundColor: "#ef444415",
    borderWidth: 1,
    borderColor: "#ef444440",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
});
