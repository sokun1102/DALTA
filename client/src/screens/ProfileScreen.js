import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API, { setAuthToken } from "../services/api";
import { imageUrl } from "../services/image";
import { useFocusEffect } from "@react-navigation/native";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  // Refresh user data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
      setAuthToken(token);
      try {
        const response = await API.get("/auth/users/me");
        const userData = response?.data?.data;
        if (userData) {
          setUser(userData);
          // Lưu thông tin user vào AsyncStorage
          await AsyncStorage.setItem("user", JSON.stringify(userData));
        }
      } catch (apiErr) {
        setUser(null);
        await AsyncStorage.removeItem("user");
      }
      } else {
        setUser(null);
        await AsyncStorage.removeItem("user");
      }
    } catch (err) {
      setUser(null);
      await AsyncStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarPress = () => {
    Alert.alert(
      "Đổi ảnh đại diện",
      "Chọn cách thay đổi ảnh đại diện",
      [
        {
          text: "Nhập URL",
          onPress: () => {
            Alert.prompt(
              "Nhập URL ảnh",
              "Vui lòng nhập URL của ảnh đại diện",
              [
                { text: "Hủy", style: "cancel" },
                {
                  text: "Lưu",
                  onPress: async (url) => {
                    if (url && url.trim()) {
                      await uploadAvatarUrl(url.trim());
                    }
                  },
                },
              ],
              "plain-text"
            );
          },
        },
        { text: "Hủy", style: "cancel" },
      ]
    );
  };

  const uploadAvatarUrl = async (url) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      setAuthToken(token);
      
      // Update avatar via profile update endpoint
      const response = await API.put("/auth/users/me", { avatar: url });

      if (response.data?.success) {
        // Reload user data
        await loadUserData();
        Alert.alert("Thành công", "Đã cập nhật ảnh đại diện");
      } else {
        throw new Error(response.data?.message || "Không thể cập nhật ảnh");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể cập nhật ảnh đại diện");
    }
  };


  const handleLogout = async () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("token");
              await AsyncStorage.removeItem("user"); // Thêm xóa user data
              setAuthToken(null);
              setUser(null);
              navigation.replace("Home");
            } catch (err) {}
          },
        },
      ]
    );
  };

  // Menu items cho user thường
  const userMenuItems = [
    {
      id: 1,
      title: "Thông tin cá nhân",
      subtitle: "Chỉnh sửa thông tin tài khoản và địa chỉ",
      onPress: () => navigation.navigate("EditProfileAndAddresses"),
    },
    {
      id: 2,
      title: "Đơn hàng của tôi",
      subtitle: "Xem lịch sử mua hàng và theo dõi đơn hàng",
      onPress: () => navigation.navigate("OrderHistory"),
    },
    {
      id: 4,
      title: "Phương thức thanh toán",
      subtitle: "Quản lý thẻ thanh toán và ví điện tử",
      onPress: () => navigation.navigate("PaymentMethods"),
    },
    {
      id: 5,
      title: "Voucher của tôi",
      subtitle: "Mã giảm giá và ưu đãi đang có",
      onPress: () => navigation.navigate("Vouchers"),
    },
    {
      id: 6,
      title: "Cài đặt",
      subtitle: "Tùy chỉnh ứng dụng và thông báo",
      onPress: () => navigation.navigate("Settings"),
    },
    {
      id: 7,
      title: "Hỗ trợ",
      subtitle: "Trung tâm trợ giúp và liên hệ",
      onPress: () => {},
    },
  ];

  // Menu items cho admin
  const adminMenuItems = [
    {
      id: 0,
      title: "Quản lý sản phẩm",
      subtitle: "Thêm, sửa, xóa sản phẩm",
      onPress: () => navigation.navigate("AdminProducts"),
      isAdmin: true,
    },
    {
      id: -1,
      title: "Quản lý đơn hàng",
      subtitle: "Xem và xử lý đơn hàng",
      onPress: () => navigation.navigate("Orders"),
      isAdmin: true,
    },
    {
      id: -2,
      title: "Thống kê doanh thu",
      subtitle: "Tổng hợp doanh thu thành công và hủy/boom",
      onPress: () => navigation.navigate("RevenueStats"),
      isAdmin: true,
    },
  ];

  const isAdmin = user?.role === "admin";

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
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
            <Text style={styles.headerTitle}>Tài Khoản</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.notLoggedInContainer}>
          <Image
            source={require("../../assets/depositphotos_57530297-stock-illustration-shopping-cart-icon.jpg")}
            style={styles.notLoggedInIcon}
          />
          <Text style={styles.notLoggedInTitle}>Chưa đăng nhập</Text>
          <Text style={styles.notLoggedInSubtitle}>
            Vui lòng đăng nhập để xem thông tin tài khoản
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <View style={styles.bottomNavBorder} />
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate("Home")}
            activeOpacity={0.7}
          >
            <Text style={styles.navIcon}>■</Text>
            <Text style={styles.navLabel}>Trang chủ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate("Categories")}
            activeOpacity={0.7}
          >
            <Text style={styles.navIcon}>□</Text>
            <Text style={styles.navLabel}>Danh mục</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate(user ? "OrderHistory" : "GuestCart")}
            activeOpacity={0.7}
          >
            <Text style={styles.navIcon}>○</Text>
            <Text style={styles.navLabel}>Đơn hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate(user ? "Cart" : "GuestCart")}
            activeOpacity={0.7}
          >
            <Text style={styles.navIcon}>▢</Text>
            <Text style={styles.navLabel}>Giỏ hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.navItem, styles.navItemActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.navIcon, styles.navIconActive]}>◯</Text>
            <Text style={[styles.navLabel, styles.navLabelActive]}>Tài khoản</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isAdmin && styles.headerAdmin]}>
        <TouchableOpacity
          style={[styles.backButton, isAdmin && styles.backButtonAdmin]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, isAdmin && styles.headerTitleAdmin]}>
            {isAdmin ? "Quản Trị" : "Tài Khoản"}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={[styles.userInfoCard, isAdmin && styles.userInfoCardAdmin]}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleAvatarPress}
            activeOpacity={0.7}
          >
            <Image
              source={
                user?.avatar
                  ? { uri: imageUrl(user.avatar) }
                  : require("../../assets/depositphotos_57530297-stock-illustration-shopping-cart-icon.jpg")
              }
              style={[styles.avatar, isAdmin && styles.avatarAdmin]}
            />
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditText}>✏️</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.userDetails}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{user?.name || "Khách"}</Text>
              {isAdmin && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>ADMIN</Text>
                </View>
              )}
            </View>
            <Text style={styles.userEmail}>{user?.email || "user@example.com"}</Text>
            <Text style={styles.userPhone}>{user?.phone_number || "Chưa có"}</Text>
          </View>
        </View>

        {/* Admin Section */}
        {isAdmin && (
          <View style={styles.adminSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quản trị hệ thống</Text>
              <View style={styles.adminIndicator} />
            </View>
            <View style={styles.menuContainer}>
              {adminMenuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, styles.menuItemAdmin]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemContent}>
                    <Text style={[styles.menuTitle, styles.menuTitleAdmin]}>
                      {item.title}
                    </Text>
                    {item.subtitle && (
                      <Text style={[styles.menuSubtitle, styles.menuSubtitleAdmin]}>
                        {item.subtitle}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.menuArrow, styles.menuArrowAdmin]}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* User Menu Items */}
        <View style={styles.userSection}>
          {isAdmin && (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tài khoản cá nhân</Text>
            </View>
          )}
          <View style={styles.menuContainer}>
            {userMenuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  {item.subtitle && (
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  )}
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <View style={styles.bottomNavBorder} />
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Home")}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>■</Text>
          <Text style={styles.navLabel}>Trang chủ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Categories")}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>□</Text>
          <Text style={styles.navLabel}>Danh mục</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate(user ? "OrderHistory" : "GuestCart")}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>○</Text>
          <Text style={styles.navLabel}>Đơn hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate(user ? "Cart" : "GuestCart")}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>▢</Text>
          <Text style={styles.navLabel}>Giỏ hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navItem, styles.navItemActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, styles.navIconActive]}>◯</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Tài khoản</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    backgroundColor: "#0a0a0a",
  },
  headerAdmin: {
    backgroundColor: "#1a0f00",
    borderBottomColor: "#f59e0b",
    borderBottomWidth: 2,
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
  backButtonAdmin: {
    backgroundColor: "#f59e0b",
    borderColor: "#fbbf24",
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
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  headerTitleAdmin: {
    color: "#fbbf24",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  userInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  userInfoCardAdmin: {
    backgroundColor: "#1a0f00",
    borderColor: "#f59e0b",
    borderWidth: 2,
    shadowColor: "#f59e0b",
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  avatarContainer: {
    marginRight: 18,
    position: "relative",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#2a2a2a",
  },
  avatarAdmin: {
    borderColor: "#f59e0b",
    borderWidth: 3,
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#0a0a0a",
    shadowColor: "#ef4444",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 5,
  },
  avatarEditText: {
    fontSize: 12,
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  userName: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginRight: 10,
  },
  adminBadge: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fbbf24",
    shadowColor: "#f59e0b",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  adminBadgeText: {
    color: "#000000",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  userEmail: {
    color: "#d1d5db",
    fontSize: 15,
    marginBottom: 6,
    letterSpacing: 0.2,
    fontWeight: "500",
  },
  userPhone: {
    color: "#9ca3af",
    fontSize: 14,
    letterSpacing: 0.2,
    fontWeight: "500",
  },
  adminSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  userSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  adminIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#f59e0b",
    marginLeft: 10,
    shadowColor: "#f59e0b",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  menuContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  menuItemAdmin: {
    backgroundColor: "#1a0f00",
    borderColor: "#f59e0b",
    borderWidth: 1.5,
    shadowColor: "#f59e0b",
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  menuItemContent: {
    flex: 1,
  },
  menuTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  menuTitleAdmin: {
    color: "#fbbf24",
  },
  menuSubtitle: {
    color: "#9ca3af",
    fontSize: 13,
    letterSpacing: 0.1,
    lineHeight: 18,
    fontWeight: "500",
  },
  menuSubtitleAdmin: {
    color: "#d97706",
  },
  menuArrow: {
    color: "#ef4444",
    fontSize: 22,
    fontWeight: "300",
    marginLeft: 12,
  },
  menuArrowAdmin: {
    color: "#f59e0b",
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 24,
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  logoutText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#0f0f0f",
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 8,
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomNavBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#ef4444",
    opacity: 0.2,
  },
  navItem: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 4,
    position: "relative",
  },
  navItemActive: {
    opacity: 1,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
    fontWeight: "bold",
    color: "#6b7280",
  },
  navIconActive: {
    color: "#ef4444",
  },
  navLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
    textAlign: "center",
  },
  navLabelActive: {
    color: "#ef4444",
    fontWeight: "700",
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  notLoggedInIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 28,
    opacity: 0.9,
    backgroundColor: "#1a1a1a",
    padding: 10,
  },
  notLoggedInTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  notLoggedInSubtitle: {
    color: "#9ca3af",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 36,
    lineHeight: 22,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#fff",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    color: "#0a0a0a",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
