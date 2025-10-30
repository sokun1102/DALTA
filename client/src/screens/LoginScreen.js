import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API, { setAuthToken } from "../services/api";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      console.log("📤 Sending login:", { email, password });

      const res = await API.post("/auth/login", { email, password });

      console.log("✅ Response:", res.data);
      Alert.alert("Success", "Đăng nhập thành công!");

      const token = res?.data?.data?.token;
      const user = res?.data?.data?.user;
      if (token) {
        // Lưu token và thông tin user vào AsyncStorage
        await AsyncStorage.setItem("token", token);
        if (user) {
          await AsyncStorage.setItem("userData", JSON.stringify(user));
        }
        setAuthToken(token);
      }

      navigation.navigate("Home");
    } catch (err) {
      console.error("❌ Login error:", err.response?.data || err.message);
      Alert.alert("Error", err.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require("../../assets/depositphotos_57530297-stock-illustration-shopping-cart-icon.jpg")} 
          style={styles.logoImage} 
        />
        <Text style={styles.title}>Brothers Shop</Text>
        <Text style={styles.subtitle}>OnlineShopping</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Password"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, (!email || !password) && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={!email || !password}
        >
          <Text style={styles.loginButtonText}>Đăng nhập</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.forgot}>Quên mật khẩu</Text>
        </TouchableOpacity>

        <View style={styles.socialRow}>
          <View style={styles.socialButton}>
            <Text style={styles.socialIcon}>f</Text>
          </View>
          <View style={styles.socialButton}>
            <Text style={styles.socialIcon}>t</Text>
          </View>
          <View style={styles.socialButton}>
            <Text style={styles.socialIcon}>g+</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerText}>
            Chưa có tài khoản? <Text style={styles.registerLink}>Đăng ký ngay</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  header: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoImage: {
    width: 96,
    height: 96,
    marginBottom: 12,
    borderRadius: 48,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 12,
    marginBottom: 8,
  },
  form: {
    marginTop: 8,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    height: 44,
    color: "#fff",
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#ef4444",
    fontWeight: "600",
    fontSize: 16,
  },
  forgot: {
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 12,
    fontSize: 14,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
    marginBottom: 16,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 12,
  },
  socialIcon: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  registerText: {
    color: "#9ca3af",
    textAlign: "center",
    fontSize: 14,
  },
  registerLink: {
    color: "#fff",
    fontWeight: "600",
  },
});
