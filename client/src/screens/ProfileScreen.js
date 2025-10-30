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

  const menuItems = [
    {
      id: 1,
      title: "Thông tin cá nhân",
      icon: "👤",
      onPress: () => {},
    },
    {
      id: 2,
      title: "Đơn hàng của tôi",
      icon: "📦",
      onPress: () => navigation.navigate("OrderHistory"),
    },
    {
      id: 3,
      title: "Địa chỉ giao hàng",
      icon: "📍",
      onPress: () => {},
    },
    {
      id: 4,
      title: "Phương thức thanh toán",
      icon: "💳",
      onPress: () => {},
    },
    {
      id: 5,
      title: "Voucher của tôi",
      icon: "🎫",
      onPress: () => {},
    },
    {
      id: 6,
      title: "Cài đặt",
      icon: "⚙️",
      onPress: () => {},
    },
    {
      id: 7,
      title: "Hỗ trợ",
      icon: "🆘",
      onPress: () => {},
    },
  ];

  // Thêm menu admin nếu user có role admin
  if (user?.role === "admin") {
    menuItems.unshift(
      {
        id: 0,
        title: "Quản lý sản phẩm",
        icon: "🛍️",
        onPress: () => navigation.navigate("AdminProducts"),
      },
      {
        id: -1,
        title: "Quản lý đơn hàng",
        icon: "📦",
        onPress: () => navigation.navigate("Orders"),
      }
    );
  }

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
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tài Khoản</Text>
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
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.navIcon}>■</Text>
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate("Categories")}
          >
            <Text style={styles.navIcon}>□</Text>
            <Text style={styles.navLabel}>Danh Mục</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>○</Text>
            <Text style={styles.navLabel}>Tìm kiếm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>▢</Text>
            <Text style={styles.navLabel}>Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
            <Text style={[styles.navIcon, styles.activeNavIcon]}>◯</Text>
            <Text style={[styles.navLabel, styles.activeNavLabel]}>Tài Khoản</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tài Khoản</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userInfoCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={require("../../assets/depositphotos_57530297-stock-illustration-shopping-cart-icon.jpg")}
              style={styles.avatar}
            />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name || "Khách"}</Text>
            <Text style={styles.userEmail}>{user?.email || "user@example.com"}</Text>
            <Text style={styles.userPhone}>{user?.phone_number || "0901518779"}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.navIcon}>■</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Categories")}
        >
          <Text style={styles.navIcon}>□</Text>
          <Text style={styles.navLabel}>Danh Mục</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>○</Text>
          <Text style={styles.navLabel}>Tìm kiếm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>▢</Text>
          <Text style={styles.navLabel}>Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <Text style={[styles.navIcon, styles.activeNavIcon]}>◯</Text>
          <Text style={[styles.navLabel, styles.activeNavLabel]}>Tài Khoản</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
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
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userEmail: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 2,
  },
  userPhone: {
    color: "#9ca3af",
    fontSize: 14,
  },
  menuContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuTitle: {
    color: "#fff",
    fontSize: 16,
  },
  menuArrow: {
    color: "#9ca3af",
    fontSize: 20,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  navItem: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 4,
  },
  activeNavItem: {
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
    color: "#000",
    fontWeight: "bold",
  },
  activeNavIcon: {
    color: "#ef4444",
  },
  navLabel: {
    fontSize: 10,
    color: "#000",
    textAlign: "center",
  },
  activeNavLabel: {
    color: "#ef4444",
    fontWeight: "600",
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  notLoggedInIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 24,
  },
  notLoggedInTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  notLoggedInSubtitle: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
