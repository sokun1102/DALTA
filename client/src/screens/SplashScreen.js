import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animation khi màn hình load
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <Image
              source={require("../../assets/depositphotos_57530297-stock-illustration-shopping-cart-icon.jpg")}
              style={styles.logoImage}
            />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Brothers Shop</Text>
          <Text style={styles.subtitle}>Trải nghiệm mua sắm tuyệt vời</Text>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.buttonContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate("Home")}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Bắt đầu mua sắm</Text>
        </TouchableOpacity>

        <View style={styles.authButtons}>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.7}
          >
            <Text style={styles.authButtonText}>Đăng nhập</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authButton, styles.authButtonSecondary]}
            onPress={() => navigation.navigate("Register")}
            activeOpacity={0.7}
          >
            <Text style={[styles.authButtonText, styles.authButtonTextSecondary]}>
              Đăng ký
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  textContainer: {
    alignItems: "center",
  },
  title: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 16,
    fontWeight: "400",
    letterSpacing: 0.3,
  },
  buttonContainer: {
    width: "100%",
  },
  startButton: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    color: "#0a0a0a",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  authButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  authButton: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  authButtonSecondary: {
    backgroundColor: "transparent",
    borderColor: "#3a3a3a",
  },
  authButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  authButtonTextSecondary: {
    color: "#9ca3af",
  },
});
