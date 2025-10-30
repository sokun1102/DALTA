import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";

export default function Header({
  isLoggedIn,
  userName,
  onProfilePress,
  onLoginPress,
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.brand}>B</Text>
        <View>
          <Text style={styles.headerTitle}>Brothers Shop</Text>
          {isLoggedIn && (
            <Text style={styles.welcomeText}>Xin chào, {userName}!</Text>
          )}
        </View>
      </View>
      <View style={styles.headerRight}>
        {isLoggedIn ? (
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={onProfilePress}
          >
            <Image 
              source={require("../../assets/depositphotos_57530297-stock-illustration-shopping-cart-icon.jpg")} 
              style={styles.profileIcon} 
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={onLoginPress}
          >
            <Text style={styles.loginText}>Đăng nhập</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 12,
  },
  brand: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ef4444",
    color: "#fff",
    textAlign: "center",
    textAlignVertical: "center",
    fontWeight: "800",
    fontSize: 18,
    marginRight: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  welcomeText: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  profileButton: {
    padding: 4,
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  loginButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  loginText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
