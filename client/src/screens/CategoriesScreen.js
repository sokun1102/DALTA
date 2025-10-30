import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  ScrollView,
  useWindowDimensions,
  RefreshControl,
  Alert,
} from "react-native";
import API, { setAuthToken } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addToGuestCart, getGuestCartCount } from "../services/guestCart";
import { imageUrl } from "../services/image";
import ProductCard from "../components/ProductCard";
import CategorySection from "../components/CategorySection";

export default function CategoriesScreen({ navigation }) {
  const { width: screenWidth } = useWindowDimensions();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failedImageProductIds, setFailedImageProductIds] = useState(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Responsive: tính số cột theo độ rộng màn hình
  const horizontalPadding = 16;
  const cardGap = 12;
  const numColumns = screenWidth >= 900 ? 4 : screenWidth >= 700 ? 3 : 2;
  const contentWidth = screenWidth - horizontalPadding * 2;
  const cardWidth = (contentWidth - cardGap * (numColumns - 1)) / numColumns;

  useEffect(() => {
    fetchData();
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        setAuthToken(token);
        try {
          const meRes = await API.get("/auth/users/me");
          const currentUser = meRes?.data?.data;
          setIsLoggedIn(!!currentUser);
        } catch (err) {
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    } catch (err) {
      setIsLoggedIn(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Lấy categories
      const categoriesRes = await API.get("/categories");
      const categoriesData = categoriesRes.data.data || [];
      setCategories(categoriesData);
      
      // Lấy products
      const productsRes = await API.get("/products");
      const productsData = productsRes.data.data || [];
      setProducts(productsData);
      
      // Phân loại sản phẩm theo danh mục
      const categorizedProducts = {};
      productsData.forEach(product => {
        const categoryId = product.category_id?._id || 'uncategorized';
        if (!categorizedProducts[categoryId]) {
          categorizedProducts[categoryId] = [];
        }
        categorizedProducts[categoryId].push(product);
      });
      setProductsByCategory(categorizedProducts);
      
    } catch (err) {
      console.error("❌ Error fetching data:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleImageError = useCallback((productId) => {
    setFailedImageProductIds((prev) => {
      const next = new Set(prev);
      next.add(productId);
      return next;
    });
  }, []);

  const addToCart = async (product) => {
    try {
      if (!isLoggedIn) {
        // Sử dụng giỏ hàng cho khách vãng lai
        await addToGuestCart(product, 1);
        Alert.alert("Thành công", "Đã thêm sản phẩm vào giỏ hàng");
        return;
      }

      const token = await AsyncStorage.getItem("token");
      setAuthToken(token);
      await API.post("/cart", {
        product_id: product._id,
        quantity: 1,
      });
      
      Alert.alert("Thành công", "Đã thêm sản phẩm vào giỏ hàng");
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Lỗi", "Không thể thêm sản phẩm vào giỏ hàng");
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : "Không xác định";
  };

  const getFilteredProducts = () => {
    if (selectedCategory === "all") {
      return products;
    }
    return productsByCategory[selectedCategory] || [];
  };

  const renderCategoryItem = ({ item }) => {
    const productCount = productsByCategory[item._id]?.length || 0;
    return (
      <TouchableOpacity 
        style={[
          styles.categoryCard,
          selectedCategory === item._id && styles.selectedCategoryCard
        ]}
        onPress={() => setSelectedCategory(item._id)}
      >
        <View style={styles.categoryImageContainer}>
          <Image 
            source={
              item?.imageUrl
                ? { uri: imageUrl(item.imageUrl) }
                : require("../../assets/depositphotos_57530297-stock-illustration-shopping-cart-icon.jpg")
            }
            style={styles.categoryImage} 
            resizeMode="cover"
            defaultSource={require("../../assets/depositphotos_57530297-stock-illustration-shopping-cart-icon.jpg")}
          />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={[
            styles.categoryName,
            selectedCategory === item._id && styles.selectedCategoryName
          ]}>
            {item.name}
          </Text>
          <Text style={styles.categoryDescription}>
            {productCount} sản phẩm
          </Text>
        </View>
        <TouchableOpacity style={styles.arrowButton}>
          <Text style={[
            styles.arrowIcon,
            selectedCategory === item._id && styles.selectedArrowIcon
          ]}>
            ›
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh Mục</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : (
          <>
            {/* Categories List */}
            <View style={styles.categoriesSection}>
              <Text style={styles.sectionTitle}>Danh mục sản phẩm</Text>
              <FlatList
                data={categories}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                contentContainerStyle={styles.categoriesList}
              />
            </View>

            {/* Products by Selected Category */}
            {selectedCategory !== "all" && (
              <View style={styles.productsSection}>
                <View style={styles.categorySectionHeader}>
                  <Text style={styles.categorySectionTitle}>
                    {getCategoryName(selectedCategory)}
                  </Text>
                  <Text style={styles.categorySectionCount}>
                    {getFilteredProducts().length} sản phẩm
                  </Text>
                </View>
                
                {getFilteredProducts().length === 0 ? (
                  <Text style={styles.emptyProductsText}>
                    Chưa có sản phẩm trong danh mục này
                  </Text>
                ) : (
                  <FlatList
                    data={getFilteredProducts()}
                    renderItem={({ item, index }) => (
                      <View
                        key={item._id}
                        style={[
                          index % numColumns !== numColumns - 1 ? { marginRight: cardGap } : null,
                        ]}
                      >
                        <ProductCard
                          product={item}
                          cardWidth={cardWidth}
                          onImageError={handleImageError}
                          failedImageProductIds={failedImageProductIds}
                          onPress={() => {
                            console.log("Product selected:", item.name);
                            // TODO: Navigate to product detail screen
                            // navigation.navigate("ProductDetail", { productId: item._id });
                          }}
                          onAddToCart={addToCart}
                        />
                      </View>
                    )}
                    keyExtractor={(item) => item._id}
                    numColumns={numColumns}
                    columnWrapperStyle={[styles.productsGrid, { marginBottom: cardGap }]}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                    contentContainerStyle={{ paddingBottom: 8 }}
                  />
                )}
              </View>
            )}

            {/* All Categories Overview */}
            {selectedCategory === "all" && (
              <View style={styles.overviewSection}>
                <Text style={styles.sectionTitle}>Tổng quan sản phẩm</Text>
                {Object.keys(productsByCategory).map(categoryId => {
                  const categoryProducts = productsByCategory[categoryId];
                  if (categoryProducts.length === 0) return null;
                  
                  return (
                    <CategorySection
                      key={categoryId}
                      categoryId={categoryId}
                      categoryName={getCategoryName(categoryId)}
                      products={categoryProducts}
                      numColumns={numColumns}
                      cardWidth={cardWidth}
                      cardGap={cardGap}
                      onImageError={handleImageError}
                      failedImageProductIds={failedImageProductIds}
                      onViewMore={(categoryId) => setSelectedCategory(categoryId)}
                      onProductPress={(product) => {
                        console.log("Product selected:", product.name);
                        // TODO: Navigate to product detail screen
                        // navigation.navigate("ProductDetail", { productId: product._id });
                      }}
                      onAddToCart={addToCart}
                      maxItems={3}
                    />
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.navIcon}>■</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <Text style={[styles.navIcon, styles.activeNavIcon]}>□</Text>
          <Text style={[styles.navLabel, styles.activeNavLabel]}>Danh Mục</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>○</Text>
          <Text style={styles.navLabel}>Tìm kiếm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>▢</Text>
          <Text style={styles.navLabel}>Order</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.navIcon}>◯</Text>
          <Text style={styles.navLabel}>Tài Khoản</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    color: "#9ca3af",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 16,
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  refreshText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
  },
  categoriesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedCategoryCard: {
    backgroundColor: "#2a2a2a",
    borderColor: "#ef4444",
  },
  categoryImageContainer: {
    marginRight: 16,
  },
  categoryImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  selectedCategoryName: {
    color: "#ef4444",
  },
  categoryDescription: {
    color: "#9ca3af",
    fontSize: 12,
  },
  arrowButton: {
    padding: 8,
  },
  arrowIcon: {
    color: "#9ca3af",
    fontSize: 20,
    fontWeight: "bold",
  },
  selectedArrowIcon: {
    color: "#ef4444",
  },
  productsSection: {
    marginBottom: 20,
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
  emptyProductsText: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  overviewSection: {
    marginBottom: 20,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  navItem: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 4,
  },
  activeNavItem: {
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
    color: "#000",
    fontWeight: "bold",
  },
  activeNavIcon: {
    color: "#ef4444",
  },
  navLabel: {
    fontSize: 10,
    color: "#000",
    textAlign: "center",
  },
  activeNavLabel: {
    color: "#ef4444",
    fontWeight: "600",
  },
});
