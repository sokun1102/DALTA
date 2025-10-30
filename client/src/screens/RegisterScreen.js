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
import API from "../services/api";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone_number, setPhone_number] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      console.log("📤 Sending register:", { name, email, phone_number, password });
      
      const response = await API.post("/auth/register", { 
        name, 
        email, 
        phone_number, 
        password 
      });
      
      console.log("✅ Register response:", response.data);
      Alert.alert("Success", "User registered successfully!");
      navigation.navigate("Login");
    } catch (err) {
      console.error("❌ Register error:", err.response?.data || err.message);
      Alert.alert("Error", err.response?.data?.message || "Register failed");
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
            value={name}
            onChangeText={setName}
            placeholder="Họ và tên"
            placeholderTextColor="#9ca3af"
          />
        </View>

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
            value={phone_number}
            onChangeText={setPhone_number}
            keyboardType="phone-pad"
            placeholder="Số điện thoại"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Mật khẩu"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <TouchableOpacity 
          style={[styles.registerButton, (!name || !email || !phone_number || !password) && styles.registerButtonDisabled]}
          onPress={handleRegister}
          disabled={!name || !email || !phone_number || !password}
        >
          <Text style={styles.registerButtonText}>Đăng ký</Text>
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

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginText}>
            Đã có tài khoản? <Text style={styles.loginLink}>Đăng nhập ngay</Text>
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
  registerButton: {
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: "#ef4444",
    fontWeight: "600",
    fontSize: 16,
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
  loginText: {
    color: "#9ca3af",
    textAlign: "center",
    fontSize: 14,
  },
  loginLink: {
    color: "#fff",
    fontWeight: "600",
  },
});
