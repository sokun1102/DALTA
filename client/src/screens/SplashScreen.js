import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";

export default function SplashScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require("../../assets/depositphotos_57530297-stock-illustration-shopping-cart-icon.jpg")} 
          style={styles.logoImage} 
        />
        <Text style={styles.title}>Brothers Shop</Text>
        <Text style={styles.subtitle}>OnlineShopping</Text>
      </View>

      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.startButtonText}>START SHOPPING</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 16,
    borderRadius: 50,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 6,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 13,
  },
  startButton: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
    marginHorizontal: 16,
  },
  startButtonText: {
    color: "#ef4444",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
