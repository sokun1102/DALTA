import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
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
  
  return (
    <TouchableOpacity 
      style={[styles.productCard, { width: cardWidth }]}
      onPress={onPress}
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
  );
}

const styles = StyleSheet.create({
  productCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  productBrand: {
    color: "#9ca3af",
    fontSize: 10,
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 1, // ảnh vuông
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
    backgroundColor: "#111",
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
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  productDescription: {
    color: "#9ca3af",
    fontSize: 11,
    marginBottom: 6,
  },
  productPrice: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  addToCartButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  addToCartText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
