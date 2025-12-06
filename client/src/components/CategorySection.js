import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import ProductCard from "./ProductCard";

export default function CategorySection({
  categoryId,
  categoryName,
  products,
  numColumns,
  cardWidth,
  cardGap,
  onImageError,
  failedImageProductIds,
  onViewMore,
  onProductPress,
  onAddToCart,
  maxItems = 4,
}) {
  const displayProducts = products.slice(0, maxItems);
  const remainingCount = products.length - maxItems;

  const renderProductItem = ({ item, index }) => {
    return (
      <View
        key={item._id}
        style={[
          index % numColumns !== numColumns - 1 ? { marginRight: cardGap } : null,
        ]}
      >
        <ProductCard
          product={item}
          cardWidth={cardWidth}
          onImageError={onImageError}
          failedImageProductIds={failedImageProductIds}
          onPress={() => onProductPress && onProductPress(item)}
          onAddToCart={onAddToCart}
        />
      </View>
    );
  };

  return (
    <View style={styles.categorySection}>
      <View style={styles.categorySectionHeader}>
        <Text style={styles.categorySectionTitle}>
          {categoryName}
        </Text>
        <Text style={styles.categorySectionCount}>
          {products.length} sản phẩm
        </Text>
      </View>
      
      <FlatList
        data={displayProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item._id}
        numColumns={numColumns}
        columnWrapperStyle={[styles.productsGrid, { marginBottom: cardGap }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={{ paddingBottom: 8 }}
      />
      
      {remainingCount > 0 && (
        <TouchableOpacity 
          style={styles.viewMoreButton}
          onPress={() => onViewMore(categoryId)}
        >
          <Text style={styles.viewMoreText}>
            Xem thêm {remainingCount} sản phẩm
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  categorySection: {
    marginBottom: 24,
  },
  categorySectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  categorySectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  categorySectionCount: {
    color: "#9ca3af",
    fontSize: 12,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  viewMoreButton: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignSelf: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  viewMoreText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
  },
});
