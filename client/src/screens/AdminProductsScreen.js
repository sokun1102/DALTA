import React, { useState, useEffect } from "react";
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, Dimensions, Image, RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API from "../services/api";
import { imageUrl } from "../services/image";

const { width: screenWidth } = Dimensions.get("window");

export default function AdminProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const numColumns = screenWidth > 700 ? 3 : screenWidth > 500 ? 2 : 1;
  const cardGap = 12;
  const horizontalPadding = 12;
  const contentWidth = screenWidth - horizontalPadding * 2;
  const cardWidth = (contentWidth - cardGap * (numColumns - 1)) / numColumns;
  const listKey = `cols-${numColumns}`;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await API.get("/products");
      setProducts(res.data.data || []);
    } catch {
      Alert.alert("Lỗi", "Không thể tải sản phẩm");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onDelete = (product) => {
    Alert.alert(
      "Xác nhận",
      `Xoá sản phẩm: ${product.name}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: async () => {
            try {
              await API.delete(`/products/${product._id}`);
              setProducts(prev => prev.filter(p => p._id !== product._id));
            } catch {
              Alert.alert("Lỗi", "Xoá thất bại");
            }
          }
        }
      ]
    );
  };

  const onEdit = (product) => navigation.navigate("AddProduct", { product });
  const onAdd = () => navigation.navigate("AddProduct");

  const renderItem = ({ item, index }) => (
    <View style={[
      styles.card,
      { width: cardWidth, marginRight: (index + 1) % numColumns === 0 ? 0 : cardGap }
    ]}>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <Image
          source={
            item.imageUrl
              ? { uri: imageUrl(item.imageUrl) }
              : require("../../assets/depositphotos_57530297-stock-illustration-shopping-cart-icon.jpg")
          }
          style={styles.productImage}
          resizeMode="cover"
        />
        {item.variations && item.variations.length > 0 && (
          <View style={styles.variationBadge}>
            <Text style={styles.variationBadgeText}>
              {item.variations.length} màu
            </Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.price}>{item.price?.toLocaleString("vi-VN") || 0}đ</Text>
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>
              {item.in_stock || 0} sp
            </Text>
          </View>
        </View>

        <Text style={styles.sku}>SKU: {item.sku || "N/A"}</Text>

        {/* Action Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity 
            style={styles.editBtn} 
            onPress={() => onEdit(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.editTxt}>✏️ Sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.delBtn} 
            onPress={() => onDelete(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.delTxt}>🗑 Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Quản lý sản phẩm</Text>
          <Text style={styles.subtitle}>{products.length} sản phẩm</Text>
        </View>
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={onAdd}
          activeOpacity={0.8}
        >
          <Text style={styles.addIcon}>+</Text>
          <Text style={styles.addTxt}>Thêm mới</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>Chưa có sản phẩm nào</Text>
          <Text style={styles.emptySubtext}>Nhấn "Thêm mới" để tạo sản phẩm đầu tiên</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={onAdd}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyButtonText}>+ Thêm sản phẩm</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          key={listKey}
          data={products}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          numColumns={numColumns}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchProducts();
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchProducts();
              }}
              tintColor="#ef4444"
              colors={["#ef4444"]}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#000" 
  },
  header: {
    flexDirection: "row", 
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: "#0a0a0a",
    borderBottomWidth: 1, 
    borderBottomColor: "#1a1a1a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  headerLeft: {
    flex: 1,
  },
  title: { 
    color: "#fff", 
    fontSize: 24, 
    fontWeight: "800",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "500",
  },
  addBtn: {
    backgroundColor: "#ef4444", 
    paddingHorizontal: 20,
    paddingVertical: 12, 
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  addIcon: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  addTxt: { 
    color: "#fff", 
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: "#1a1a1a", 
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  imageContainer: {
    width: "100%",
    height: 180,
    backgroundColor: "#0a0a0a",
    position: "relative",
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  variationBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  variationBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  productInfo: {
    padding: 16,
  },
  name: { 
    color: "#fff", 
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  desc: { 
    color: "#9ca3af", 
    fontSize: 13, 
    marginBottom: 12,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  price: { 
    color: "#ef4444", 
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  stockBadge: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockText: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "600",
  },
  sku: { 
    color: "#6b7280", 
    fontSize: 11, 
    marginBottom: 12,
    fontWeight: "500",
  },
  btnRow: { 
    flexDirection: "row", 
    marginTop: 8,
    gap: 8,
  },
  editBtn: {
    flex: 1,
    backgroundColor: "#10b981", 
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  editTxt: { 
    color: "#fff", 
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  delBtn: {
    flex: 1,
    backgroundColor: "#ef4444", 
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  delTxt: { 
    color: "#fff", 
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  loadingText: {
    color: "#9ca3af",
    fontSize: 15,
    marginTop: 16,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  listContent: { 
    padding: 16, 
    paddingBottom: 40 
  }
});
