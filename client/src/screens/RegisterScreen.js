import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import API from "../services/api";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone_number, setPhone_number] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    const re = /^[0-9]{10,11}$/;
    return re.test(phone);
  };

  const handleRegister = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ và tên");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập email");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Lỗi", "Email không hợp lệ");
      return;
    }

    if (!phone_number.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
      return;
    }

    if (!validatePhone(phone_number)) {
      Alert.alert("Lỗi", "Số điện thoại phải có 10-11 chữ số");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    try {
      console.log("📤 Sending register:", {
        name,
        email,
        phone_number,
        password,
      });

      const response = await API.post("/auth/register", {
        name,
        email,
        phone_number,
        password,
      });

      console.log("✅ Register response:", response.data);
      Alert.alert("Thành công", "Đăng ký thành công! Vui lòng đăng nhập.", [
        {
          text: "OK",
          onPress: () => navigation.navigate("Login"),
        },
      ]);
    } catch (err) {
      console.error("❌ Register error:", err.response?.data || err.message);
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      name.trim() &&
      email.trim() &&
      validateEmail(email) &&
      phone_number.trim() &&
      validatePhone(phone_number) &&
      password.trim() &&
      password.length >= 6
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Image
                source={require("../../assets/depositphotos_57530297-stock-illustration-shopping-cart-icon.jpg")}
                style={styles.logoImage}
              />
            </View>
          </View>

          <Text style={styles.title}>Tạo tài khoản mới</Text>
          <Text style={styles.subtitle}>Đăng ký để bắt đầu mua sắm</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và tên</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nhập họ và tên của bạn"
                placeholderTextColor="#6b7280"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="Nhập email của bạn"
                placeholderTextColor="#6b7280"
                autoCorrect={false}
              />
            </View>
            {email.trim() && !validateEmail(email) && (
              <Text style={styles.errorText}>Email không hợp lệ</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={phone_number}
                onChangeText={setPhone_number}
                keyboardType="phone-pad"
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#6b7280"
                autoCorrect={false}
              />
            </View>
            {phone_number.trim() && !validatePhone(phone_number) && (
              <Text style={styles.errorText}>
                Số điện thoại phải có 10-11 chữ số
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                placeholderTextColor="#6b7280"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Text style={styles.eyeButtonText}>
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </Text>
              </TouchableOpacity>
            </View>
            {password.trim() && password.length < 6 && (
              <Text style={styles.errorText}>
                Mật khẩu phải có ít nhất 6 ký tự
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.registerButton,
              (!isFormValid() || loading) && styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={!isFormValid() || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.registerButtonText}>
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>hoặc</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.7}
          >
            <Text style={styles.loginText}>
              Đã có tài khoản?{" "}
              <Text style={styles.loginLinkText}>Đăng nhập ngay</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  backButton: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "600",
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
  logoImage: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 15,
    fontWeight: "400",
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    paddingHorizontal: 16,
    height: 52,
  },
  input: {
    flex: 1,
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "400",
  },
  eyeButton: {
    padding: 4,
  },
  eyeButtonText: {
    fontSize: 20,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: "500",
  },
  registerButton: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonDisabled: {
    opacity: 0.5,
  },
  registerButtonText: {
    color: "#0a0a0a",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#2a2a2a",
  },
  dividerText: {
    color: "#6b7280",
    fontSize: 13,
    marginHorizontal: 16,
    fontWeight: "500",
  },
  loginLink: {
    alignItems: "center",
  },
  loginText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "400",
  },
  loginLinkText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
