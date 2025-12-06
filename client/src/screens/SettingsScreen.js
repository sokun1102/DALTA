import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthToken } from "../services/api";
import { useFocusEffect } from "@react-navigation/native";

export default function SettingsScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  
  // Settings states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [darkMode, setDarkMode] = useState(true); // App is dark mode by default

  useFocusEffect(
    React.useCallback(() => {
      loadSettings();
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem("appSettings");
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        setNotificationsEnabled(parsedSettings.notificationsEnabled ?? true);
        setEmailNotifications(parsedSettings.emailNotifications ?? true);
        setOrderUpdates(parsedSettings.orderUpdates ?? true);
        setPromotions(parsedSettings.promotions ?? false);
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        notificationsEnabled,
        emailNotifications,
        orderUpdates,
        promotions,
      };
      await AsyncStorage.setItem("appSettings", JSON.stringify(settings));
      Alert.alert("Thành công", "Đã lưu cài đặt");
    } catch (err) {
      Alert.alert("Lỗi", "Không thể lưu cài đặt");
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      "Xóa cache",
      "Bạn có chắc chắn muốn xóa cache? Điều này sẽ xóa dữ liệu tạm thời nhưng không ảnh hưởng đến đăng nhập.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear cache but keep important data
              // Note: In a real app, you might want to clear image cache, etc.
              Alert.alert("Thành công", "Đã xóa cache");
            } catch (err) {
              Alert.alert("Lỗi", "Không thể xóa cache");
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
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
              await AsyncStorage.removeItem("user");
              await AsyncStorage.removeItem("userData");
              setAuthToken(null);
              navigation.replace("Home");
            } catch (err) {
              Alert.alert("Lỗi", "Không thể đăng xuất");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Xóa tài khoản",
      "Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            Alert.alert(
              "Xác nhận",
              "Vui lòng liên hệ hỗ trợ để xóa tài khoản của bạn.",
              [{ text: "OK" }]
            );
          },
        },
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onPress, 
    showSwitch = false, 
    switchValue = false, 
    onSwitchChange = null,
    danger = false 
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={showSwitch}
      activeOpacity={0.7}
    >
      <View style={styles.settingItemLeft}>
        {icon && <Text style={styles.settingIcon}>{icon}</Text>}
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: "#2a2a2a", true: "#ef4444" }}
          thumbColor={switchValue ? "#fff" : "#9ca3af"}
          ios_backgroundColor="#2a2a2a"
        />
      ) : (
        value && <Text style={styles.settingValue}>{value}</Text>
      )}
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>Cài đặt</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Thông báo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông báo</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon="🔔"
              title="Thông báo đẩy"
              subtitle="Nhận thông báo về đơn hàng và khuyến mãi"
              showSwitch={true}
              switchValue={notificationsEnabled}
              onSwitchChange={(value) => {
                setNotificationsEnabled(value);
                saveSettings();
              }}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="📧"
              title="Thông báo qua email"
              subtitle="Nhận email về đơn hàng và tài khoản"
              showSwitch={true}
              switchValue={emailNotifications}
              onSwitchChange={(value) => {
                setEmailNotifications(value);
                saveSettings();
              }}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="📦"
              title="Cập nhật đơn hàng"
              subtitle="Thông báo khi đơn hàng thay đổi trạng thái"
              showSwitch={true}
              switchValue={orderUpdates}
              onSwitchChange={(value) => {
                setOrderUpdates(value);
                saveSettings();
              }}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="🎁"
              title="Khuyến mãi và ưu đãi"
              subtitle="Nhận thông báo về các chương trình khuyến mãi"
              showSwitch={true}
              switchValue={promotions}
              onSwitchChange={(value) => {
                setPromotions(value);
                saveSettings();
              }}
            />
          </View>
        </View>

        {/* Tài khoản */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon="👤"
              title="Thông tin cá nhân"
              subtitle="Chỉnh sửa thông tin tài khoản"
              onPress={() => navigation.navigate("EditProfileAndAddresses", { initialTab: "profile" })}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="🔒"
              title="Bảo mật"
              subtitle="Đổi mật khẩu và cài đặt bảo mật"
              onPress={() => navigation.navigate("EditProfileAndAddresses", { initialTab: "profile" })}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="📍"
              title="Địa chỉ giao hàng"
              subtitle="Quản lý địa chỉ nhận hàng"
              onPress={() => navigation.navigate("EditProfileAndAddresses", { initialTab: "addresses" })}
            />
          </View>
        </View>

        {/* Ứng dụng */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ứng dụng</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon="🗑️"
              title="Xóa cache"
              subtitle="Xóa dữ liệu tạm thời để giải phóng dung lượng"
              onPress={handleClearCache}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="ℹ️"
              title="Về ứng dụng"
              subtitle="Phiên bản và thông tin ứng dụng"
              value="v1.0.0"
              onPress={() => Alert.alert("Về ứng dụng", "Ứng dụng mua sắm\nPhiên bản: 1.0.0")}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="📄"
              title="Điều khoản sử dụng"
              subtitle="Xem điều khoản và chính sách"
              onPress={() => Alert.alert("Điều khoản", "Điều khoản sử dụng sẽ được hiển thị tại đây.")}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="🔐"
              title="Chính sách bảo mật"
              subtitle="Xem chính sách bảo mật thông tin"
              onPress={() => Alert.alert("Bảo mật", "Chính sách bảo mật sẽ được hiển thị tại đây.")}
            />
          </View>
        </View>

        {/* Hỗ trợ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hỗ trợ</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon="💬"
              title="Trung tâm trợ giúp"
              subtitle="Câu hỏi thường gặp và hướng dẫn"
              onPress={() => Alert.alert("Trợ giúp", "Trung tâm trợ giúp sẽ được hiển thị tại đây.")}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="📞"
              title="Liên hệ hỗ trợ"
              subtitle="Hotline: 1900-xxxx"
              value="1900-xxxx"
              onPress={() => Alert.alert("Liên hệ", "Hotline: 1900-xxxx\nEmail: support@example.com")}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="⭐"
              title="Đánh giá ứng dụng"
              subtitle="Giúp chúng tôi cải thiện ứng dụng"
              onPress={() => Alert.alert("Đánh giá", "Cảm ơn bạn đã sử dụng ứng dụng!")}
            />
          </View>
        </View>

        {/* Đăng xuất và Xóa tài khoản */}
        {user && (
          <View style={styles.section}>
            <View style={styles.sectionCard}>
              <SettingItem
                icon="🚪"
                title="Đăng xuất"
                subtitle="Đăng xuất khỏi tài khoản hiện tại"
                onPress={handleLogout}
                danger={true}
              />
              <View style={styles.divider} />
              <SettingItem
                icon="🗑️"
                title="Xóa tài khoản"
                subtitle="Xóa vĩnh viễn tài khoản của bạn"
                onPress={handleDeleteAccount}
                danger={true}
              />
            </View>
          </View>
        )}

        {/* Footer spacing */}
        <View style={styles.footerSpacing} />
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
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(239, 68, 68, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.3)",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    color: "#ef4444",
    fontSize: 20,
    fontWeight: "700",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
    textShadowColor: "rgba(239, 68, 68, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    color: "#ef4444",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: 0.5,
    textShadowColor: "rgba(239, 68, 68, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sectionCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.2)",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "transparent",
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 16,
  },
  settingIcon: {
    fontSize: 24,
    width: 32,
    textAlign: "center",
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  settingTitleDanger: {
    color: "#ef4444",
  },
  settingSubtitle: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  settingValue: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#2a2a2a",
    marginLeft: 68,
  },
  footerSpacing: {
    height: 24,
  },
});

