import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import API, { setAuthToken } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addToGuestCart, getGuestCartCount } from "../services/guestCart";
import { imageUrl } from "../services/image";
import ProductCard from "../components/ProductCard";
import CategorySection from "../components/CategorySection";

export default function CategoriesScreen({ navigation, route }) {
  const { width: screenWidth } = useWindowDimensions();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(route?.params?.categoryId || "all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failedImageProductIds, setFailedImageProductIds] = useState(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const scrollViewRef = useRef(null);
  const productsSectionRef = useRef(null);
  const [productsSectionY, setProductsSectionY] = useState(0);

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

  // Cập nhật selectedCategory khi route params thay đổi
  useEffect(() => {
    if (route?.params?.categoryId) {
      setSelectedCategory(route.params.categoryId);
    } else if (route?.params?.categoryId === undefined && route?.key) {
      // Reset về "all" nếu không có params
      setSelectedCategory("all");
    }
  }, [route?.params?.categoryId]);

  // Cập nhật khi screen được focus
  useFocusEffect(
    useCallback(() => {
      if (route?.params?.categoryId) {
        setSelectedCategory(route.params.categoryId);
      }
    }, [route?.params?.categoryId])
  );

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
      // Kiểm tra nếu product có variations thì yêu cầu vào ProductDetailScreen
      if (product.variations && product.variations.length > 0) {
        // Tìm variation đầu tiên có stock > 0
        const availableVariation = product.variations.find(v => (v.stock || 0) > 0);
        
        if (!availableVariation) {
          Alert.alert("Thông báo", "Sản phẩm này hiện đã hết hàng");
          return;
        }
        
        // Nếu có variation, yêu cầu vào ProductDetailScreen để chọn
        Alert.alert(
          "Chọn biến thể",
          "Sản phẩm này có nhiều màu sắc. Vui lòng vào trang chi tiết để chọn màu sắc trước khi thêm vào giỏ hàng.",
          [
            { text: "Hủy", style: "cancel" },
            {
              text: "Xem chi tiết",
              onPress: () => {
                const productId = product._id?.toString() || product._id;
                navigation.navigate("ProductDetail", { productId });
              }
            }
          ]
        );
        return;
      }

      // Nếu không có variations, thêm vào cart bình thường
      if (!isLoggedIn) {
        // Sử dụng giỏ hàng cho khách vãng lai
        await addToGuestCart(product, 1, {});
        Alert.alert("Thành công", "Đã thêm sản phẩm vào giỏ hàng");
        return;
      }

      const token = await AsyncStorage.getItem("token");
      setAuthToken(token);
      await API.post("/cart", {
        product_id: product._id,
        quantity: 1,
        variation: {}, // Không có variation
      });
      
      Alert.alert("Thành công", "Đã thêm sản phẩm vào giỏ hàng");
    } catch (error) {
      console.error("Error adding to cart:", error);
      const errorMessage = error.response?.data?.message || "Không thể thêm sản phẩm vào giỏ hàng";
      Alert.alert("Lỗi", errorMessage);
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

  // Scroll đến phần products khi chọn category
  useEffect(() => {
    if (selectedCategory !== "all" && productsSectionY > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ 
          y: productsSectionY - 100, 
          animated: true 
        });
      }, 300);
    }
  }, [selectedCategory, productsSectionY]);

  const renderCategoryItem = ({ item }) => {
    const productCount = productsByCategory[item._id]?.length || 0;
    const isSelected = selectedCategory === item._id;
    
    return (
      <TouchableOpacity 
        style={[
          styles.categoryCard,
          isSelected && styles.selectedCategoryCard
        ]}
        onPress={() => setSelectedCategory(item._id)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.categoryImageContainer,
          isSelected && styles.selectedCategoryImageContainer
        ]}>
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
            isSelected && styles.selectedCategoryName
          ]}>
            {item.name}
          </Text>
          <Text style={styles.categoryDescription}>
            {productCount} sản phẩm
          </Text>
        </View>
        <View style={[
          styles.arrowButton,
          isSelected && styles.selectedArrowButton
        ]}>
          <Text style={[
            styles.arrowIcon,
            isSelected && styles.selectedArrowIcon
          ]}>
            ›
          </Text>
        </View>
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
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Danh mục sản phẩm</Text>
          {selectedCategory !== "all" && (
            <Text style={styles.headerSubtitle}>{getCategoryName(selectedCategory)}</Text>
          )}
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView 
        ref={scrollViewRef}
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
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Danh mục sản phẩm</Text>
                <Text style={styles.sectionSubtitle}>Chọn danh mục để xem sản phẩm</Text>
              </View>
              <View style={styles.categoriesGrid}>
                {categories.map((category) => {
                  const productCount = productsByCategory[category._id]?.length || 0;
                  const isSelected = selectedCategory === category._id;
                  
                  // Icons cho từng category
                  const getCategoryIcon = (name) => {
                    const nameLower = name.toLowerCase();
                    if (nameLower.includes("điện thoại") || nameLower.includes("phone")) return "📱";
                    if (nameLower.includes("laptop")) return "💻";
                    if (nameLower.includes("tablet")) return "📱";
                    if (nameLower.includes("phụ kiện") || nameLower.includes("accessory")) return "🔌";
                    return "📦";
                  };
                  
                  return (
                    <TouchableOpacity
                      key={category._id}
                      style={[
                        styles.categoryCardNew,
                        isSelected && styles.selectedCategoryCardNew
                      ]}
                      onPress={() => setSelectedCategory(category._id)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.categoryIconContainer,
                        isSelected && styles.selectedCategoryIconContainer
                      ]}>
                        <Text style={styles.categoryIcon}>{getCategoryIcon(category.name)}</Text>
                      </View>
                      <Text style={[
                        styles.categoryNameNew,
                        isSelected && styles.selectedCategoryNameNew
                      ]}>
                        {category.name}
                      </Text>
                      <Text style={styles.categoryCountNew}>
                        {productCount} sản phẩm
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Products by Selected Category */}
            {selectedCategory !== "all" && (
              <View 
                ref={productsSectionRef} 
                collapsable={false} 
                style={styles.productsSection}
                onLayout={(event) => {
                  const { y } = event.nativeEvent.layout;
                  setProductsSectionY(y);
                }}
              >
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
        <View style={styles.bottomNavBorder} />
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate("Home")}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>■</Text>
          <Text style={styles.navLabel}>Trang chủ</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navItem, styles.navItemActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, styles.navIconActive]}>□</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Danh mục</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate(isLoggedIn ? "OrderHistory" : "Home")}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>○</Text>
          <Text style={styles.navLabel}>Đơn hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate(isLoggedIn ? "Cart" : "GuestCart")}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>▢</Text>
          <Text style={styles.navLabel}>Giỏ hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate("Profile")}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>◯</Text>
          <Text style={styles.navLabel}>Tài khoản</Text>
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
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#1a1a1a",
    backgroundColor: "#0a0a0a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  backIcon: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.5,
    textShadowColor: "rgba(239, 68, 68, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 0.2,
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
    paddingVertical: 80,
  },
  loadingText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: 0.2,
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
    marginBottom: 32,
    paddingTop: 20,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
    letterSpacing: 0.5,
    textShadowColor: "rgba(239, 68, 68, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sectionSubtitle: {
    color: "#9ca3af",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 16,
    justifyContent: "space-between",
  },
  categoryCardNew: {
    width: "47%",
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
    overflow: "hidden",
    position: "relative",
  },
  selectedCategoryCardNew: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "#ef4444",
    borderWidth: 3,
    shadowColor: "#ef4444",
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 16,
  },
  categoryIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#3a3a3a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  selectedCategoryIconContainer: {
    backgroundColor: "#ef4444",
    borderColor: "#ff6b6b",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 16,
    transform: [{ scale: 1.08 }],
  },
  categoryIcon: {
    fontSize: 40,
  },
  categoryNameNew: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: 0.3,
    lineHeight: 22,
  },
  selectedCategoryNameNew: {
    color: "#ef4444",
    fontSize: 17,
    textShadowColor: "rgba(239, 68, 68, 0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  categoryCountNew: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    overflow: "hidden",
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCategoryCard: {
    backgroundColor: "#1a1a1a",
    borderColor: "#ef4444",
    shadowColor: "#ef4444",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryImageContainer: {
    marginRight: 16,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#2a2a2a",
  },
  selectedCategoryImageContainer: {
    borderWidth: 2,
    borderColor: "#ef4444",
  },
  categoryImage: {
    width: 56,
    height: 56,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  selectedCategoryName: {
    color: "#ef4444",
  },
  categoryDescription: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "500",
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedArrowButton: {
    backgroundColor: "#ef4444",
  },
  arrowIcon: {
    color: "#9ca3af",
    fontSize: 18,
    fontWeight: "bold",
  },
  selectedArrowIcon: {
    color: "#fff",
  },
  productsSection: {
    marginBottom: 24,
    paddingTop: 8,
  },
  categorySectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
    marginTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 3,
    borderBottomColor: "rgba(239, 68, 68, 0.3)",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderRadius: 16,
    paddingTop: 16,
    marginHorizontal: 16,
  },
  categorySectionTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.5,
    textShadowColor: "rgba(239, 68, 68, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  categorySectionCount: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "800",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#ef4444",
    overflow: "hidden",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  emptyProductsText: {
    color: "#9ca3af",
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    fontWeight: "600",
    letterSpacing: 0.2,
    backgroundColor: "#1a1a1a",
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  overviewSection: {
    marginBottom: 20,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#0f0f0f",
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 8,
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomNavBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#ef4444",
    opacity: 0.2,
  },
  navItem: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 4,
    position: "relative",
  },
  navItemActive: {
    opacity: 1,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
    fontWeight: "bold",
    color: "#6b7280",
  },
  navIconActive: {
    color: "#ef4444",
  },
  navLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
    textAlign: "center",
  },
  navLabelActive: {
    color: "#ef4444",
    fontWeight: "700",
  },
});
