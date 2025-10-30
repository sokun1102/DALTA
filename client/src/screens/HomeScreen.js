import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  FlatList,
  useWindowDimensions,
  RefreshControl,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API, { setAuthToken } from "../services/api";
import { imageUrl } from "../services/image";
import { useFocusEffect } from "@react-navigation/native";
import ProductCard from "../components/ProductCard";
import CategoryTab from "../components/CategoryTab";
import CategorySection from "../components/CategorySection";
import SearchBar from "../components/SearchBar";
import Header from "../components/Header";
import { addToGuestCart, getGuestCartCount } from "../services/guestCart";

export default function HomeScreen({ navigation }) {
  const { width: screenWidth } = useWindowDimensions();
  const [searchText, setSearchText] = useState("");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failedImageProductIds, setFailedImageProductIds] = useState(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [cartCount, setCartCount] = useState(0);

  // Responsive: tính số cột theo độ rộng màn hình
  const horizontalPadding = 16; // trùng với styles.productsContainer paddingHorizontal
  const cardGap = 12;
  const numColumns = screenWidth >= 900 ? 4 : screenWidth >= 700 ? 3 : 2;
  const contentWidth = screenWidth - horizontalPadding * 2;
  const cardWidth = (contentWidth - cardGap * (numColumns - 1)) / numColumns;

  useEffect(() => {
    fetchData();
    checkLoginStatus();
    loadCartCount();
  }, []);

  // Refresh login status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      checkLoginStatus();
      loadCartCount();
    }, [])
  );

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        setAuthToken(token);
        try {
          const meRes = await API.get("/auth/users/me");
          const currentUser = meRes?.data?.data;
          setIsLoggedIn(true);
          setUserName(currentUser?.name || currentUser?.email || "");
        } catch (apiErr) {
          console.error("❌ /auth/users/me error:", apiErr.response?.data || apiErr.message);
          setIsLoggedIn(false);
          setUserName("");
        }
      } else {
        setIsLoggedIn(false);
        setUserName("");
      }
    } catch (err) {
      console.error("❌ Error checking login status:", err);
      setIsLoggedIn(false);
      setUserName("");
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

  const loadCartCount = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        setAuthToken(token);
        const response = await API.get("/cart");
        const cart = response.data.data;
        const totalItems = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        setCartCount(totalItems);
      } else {
        // Nếu không đăng nhập, sử dụng giỏ hàng cho khách vãng lai
        const guestCartCount = await getGuestCartCount();
        setCartCount(guestCartCount);
      }
    } catch (e) {
      // Fallback to guest cart
      const guestCartCount = await getGuestCartCount();
      setCartCount(guestCartCount);
    }
  };

  const addToCart = async (product) => {
    try {
      if (!isLoggedIn) {
        // Sử dụng giỏ hàng cho khách vãng lai
        await addToGuestCart(product, 1);
        await loadCartCount();
        Alert.alert("Thành công", "Đã thêm sản phẩm vào giỏ hàng");
        return;
      }

      const token = await AsyncStorage.getItem("token");
      setAuthToken(token);
      await API.post("/cart", {
        product_id: product._id,
        quantity: 1,
      });
      
      // Cập nhật số lượng giỏ hàng
      await loadCartCount();
      
      Alert.alert("Thành công", "Đã thêm sản phẩm vào giỏ hàng");
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Lỗi", "Không thể thêm sản phẩm vào giỏ hàng");
    }
  };

  const handleImageError = useCallback((productId) => {
    setFailedImageProductIds((prev) => {
      const next = new Set(prev);
      next.add(productId);
      return next;
    });
  }, []);

  const getFilteredProducts = () => {
    let filteredProducts = [];
    
    if (selectedCategory === "all") {
      filteredProducts = products;
    } else {
      filteredProducts = productsByCategory[selectedCategory] || [];
    }
    
    // Áp dụng tìm kiếm nếu có
    if (searchText.trim()) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(searchText.toLowerCase()) ||
        product.description.toLowerCase().includes(searchText.toLowerCase()) ||
        (product.category_id?.name && product.category_id.name.toLowerCase().includes(searchText.toLowerCase()))
      );
    }
    
    return filteredProducts;
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : "Không xác định";
  };

  const renderProductItem = ({ item, index }) => {
    return (
      <View
        key={item._id}
        style={[
          // canh lề phải/trái khi có nhiều cột
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
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header
        isLoggedIn={isLoggedIn}
        userName={userName}
        onProfilePress={() => navigation.navigate("Profile")}
        onLoginPress={() => navigation.navigate("Login")}
      />

      {/* Search Bar */}
      <SearchBar
        searchText={searchText}
        onSearchChange={setSearchText}
        onSearchSubmit={() => console.log("Search:", searchText)}
        cartCount={cartCount}
        onCartPress={() => navigation.navigate(isLoggedIn ? "Cart" : "GuestCart")}
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Banner */}
        <View style={styles.banner}>
          <Image
            source={require("../../assets/back to school.jpg")}
            style={styles.bannerBg}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay} />
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Back to School</Text>
            <Text style={styles.bannerSubtitle}>Deal Siêu hời</Text>
            <View style={styles.discountTag}>
              <Text style={styles.discountText}>Upto 70% Off</Text>
            </View>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => navigation.navigate("Categories")}
            >
              <Text style={styles.ctaText}>Mua sắm ngay</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Tabs */}
        <View style={styles.categoryTabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={[
                styles.categoryTab, 
                selectedCategory === "all" && styles.activeCategoryTab
              ]}
              onPress={() => setSelectedCategory("all")}
            >
              <Text style={[
                styles.categoryTabText,
                selectedCategory === "all" && styles.activeCategoryTabText
              ]}>
                Tất cả
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <CategoryTab
                key={category._id}
                category={category}
                isActive={selectedCategory === category._id}
                onPress={() => setSelectedCategory(category._id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Products by Category */}
        <View style={styles.productsContainer}>
          {loading ? (
            <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
          ) : (
            <>
              {searchText.trim() ? (
                // Hiển thị kết quả tìm kiếm
                <>
                  <View style={styles.categorySectionHeader}>
                    <Text style={styles.categorySectionTitle}>
                      Kết quả tìm kiếm: "{searchText}"
                    </Text>
                    <Text style={styles.categorySectionCount}>
                      {getFilteredProducts().length} sản phẩm
                    </Text>
                  </View>
                  {getFilteredProducts().length === 0 ? (
                    <Text style={styles.loadingText}>Không tìm thấy sản phẩm nào</Text>
                  ) : (
                    <FlatList
                      data={getFilteredProducts()}
                      renderItem={renderProductItem}
                      keyExtractor={(item) => item._id}
                      numColumns={numColumns}
                      columnWrapperStyle={[styles.productsGrid, { marginBottom: cardGap }]}
                      showsVerticalScrollIndicator={false}
                      scrollEnabled={false}
                      contentContainerStyle={{ paddingBottom: 8 }}
                    />
                  )}
                </>
              ) : selectedCategory === "all" ? (
                // Hiển thị tất cả sản phẩm theo danh mục
                Object.keys(productsByCategory).map(categoryId => {
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
                      maxItems={4}
                    />
                  );
                })
              ) : (
                // Hiển thị sản phẩm của danh mục được chọn
                <>
                  <View style={styles.categorySectionHeader}>
                    <Text style={styles.categorySectionTitle}>
                      {getCategoryName(selectedCategory)}
                    </Text>
                    <Text style={styles.categorySectionCount}>
                      {getFilteredProducts().length} sản phẩm
                    </Text>
                  </View>
                  {getFilteredProducts().length === 0 ? (
                    <Text style={styles.loadingText}>Chưa có sản phẩm trong danh mục này</Text>
                  ) : (
                    <FlatList
                      data={getFilteredProducts()}
                      renderItem={renderProductItem}
                      keyExtractor={(item) => item._id}
                      numColumns={numColumns}
                      columnWrapperStyle={[styles.productsGrid, { marginBottom: cardGap }]}
                      showsVerticalScrollIndicator={false}
                      scrollEnabled={false}
                      contentContainerStyle={{ paddingBottom: 8 }}
                    />
                  )}
                </>
              )}
            </>
          )}
        </View>

        {/* Mega Sales Section */}
        <View style={styles.megaSalesHeader}>
          <Text style={styles.megaSalesTitle}>Mega Sales</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>■</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate("Categories")}
        >
          <Text style={styles.navIcon}>□</Text>
          <Text style={styles.navLabel}>Danh Mục</Text>
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
          onPress={() => navigation.navigate("Profile")}
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
  content: {
    flex: 1,
  },
  banner: {
    height: 180,
    backgroundColor: "#1a1a1a",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  bannerBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  bannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
  },
  bannerContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  ctaButton: {
    marginTop: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  ctaText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "700",
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
  },
  bannerSubtitle: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 12,
  },
  discountTag: {
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  discountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoryItem: {
    alignItems: "center",
    marginHorizontal: 12,
    width: 70,
  },
  categoryImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 6,
  },
  categoryName: {
    color: "#fff",
    fontSize: 11,
    textAlign: "center",
  },
  categoryTabsContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  activeCategoryTab: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  categoryTabText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "500",
  },
  activeCategoryTabText: {
    color: "#fff",
    fontWeight: "600",
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
  productsContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  megaSalesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  megaSalesTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  viewAllButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewAllText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "600",
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
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
    color: "#000",
    fontWeight: "bold",
  },
  navLabel: {
    fontSize: 10,
    color: "#000",
    textAlign: "center",
  },
  loadingText: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
});
