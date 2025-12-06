import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from "react-native";
import { imageUrl } from "../services/image";

export default function ProductCard({ 
  product, 
  cardWidth, 
  onImageError, 
  failedImageProductIds,
  onPress,
  onAddToCart
}) {
  const useFallback = failedImageProductIds.has(product._id) || !product?.imageUrl;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateY = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.timing(rotateY, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(rotateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  return (
    <Animated.View
      style={[
        { width: cardWidth },
        {
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            {
              rotateY: rotateY.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '5deg'],
              }),
            },
            { perspective: 1000 },
          ],
        },
      ]}
    >
    <TouchableOpacity 
      style={[styles.productCard]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <View style={styles.productHeader}>
        <Text style={styles.productBrand}>
          {product.category_id?.name || "Brothers Shop"}
        </Text>
      </View>
      <View style={styles.imageWrapper}>
        <Image
          source={
            useFallback
              ? require("../../assets/depositphotos_57530297-stock-illustration-shopping-cart-icon.jpg")
              : { uri: imageUrl(product.imageUrl) }
          }
          style={styles.productImage}
          resizeMode="cover"
          defaultSource={require("../../assets/depositphotos_57530297-stock-illustration-shopping-cart-icon.jpg")}
          onError={() => onImageError(product._id)}
        />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        {!!product.description && (
          <Text numberOfLines={2} style={styles.productDescription}>
            {product.description}
          </Text>
        )}
        <Text style={styles.productPrice}>
          {product.price?.toLocaleString("vi-VN")}đ
        </Text>
        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={() => onAddToCart && onAddToCart(product)}
        >
          <Text style={styles.addToCartText}>🛒 Thêm vào giỏ</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  productCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    overflow: "hidden",
    transform: [{ perspective: 1000 }],
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center",
  },
  productBrand: {
    color: "#9ca3af",
    fontSize: 10,
    fontWeight: "600",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  productDescription: {
    color: "#9ca3af",
    fontSize: 11,
    marginBottom: 8,
    lineHeight: 16,
  },
  productPrice: {
    color: "#ef4444",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  addToCartButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  addToCartText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
