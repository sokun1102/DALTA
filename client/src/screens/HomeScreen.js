import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Animated,
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
  
  // 3D Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const bannerRotateX = useRef(new Animated.Value(0)).current;
  const bannerScale = useRef(new Animated.Value(1)).current;
  const categoryTabsOpacity = useRef(new Animated.Value(0)).current;
  const categoryTabsTranslateY = useRef(new Animated.Value(50)).current;

  // Responsive: tính số cột theo độ rộng màn hình
  const horizontalPadding = 16; // trùng với styles.productsContainer paddingHorizontal
  const cardGap = 12;
  const numColumns = screenWidth >= 900 ? 4 : screenWidth >= 700 ? 3 : 2;
  const contentWidth = screenWidth - horizontalPadding * 2;
  const cardWidth = (contentWidth - cardGap * (numColumns - 1)) / numColumns;
  
  // Responsive banner và typography
  const bannerHeight = screenWidth >= 700 ? 300 : screenWidth >= 500 ? 280 : 260;
  const bannerPadding = screenWidth >= 700 ? 22 : screenWidth >= 500 ? 20 : 18;
  const titleFontSize = screenWidth >= 700 ? 32 : screenWidth >= 500 ? 30 : 26;
  const subtitleFontSize = screenWidth >= 700 ? 15 : screenWidth >= 500 ? 14 : 13;
  const badgeFontSize = screenWidth >= 700 ? 12 : screenWidth >= 500 ? 11 : 10;
  const statNumberSize = screenWidth >= 700 ? 17 : screenWidth >= 500 ? 16 : 15;
  const statLabelSize = screenWidth >= 700 ? 10 : screenWidth >= 500 ? 9.5 : 9;
  const ctaFontSize = screenWidth >= 700 ? 14 : screenWidth >= 500 ? 13.5 : 13;

  useEffect(() => {
    fetchData();
    checkLoginStatus();
    loadCartCount();
    
    // 3D Banner entrance animation
    Animated.parallel([
      Animated.timing(bannerRotateX, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(bannerScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(categoryTabsOpacity, {
        toValue: 1,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.spring(categoryTabsTranslateY, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
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
          if (currentUser) {
          setIsLoggedIn(true);
          setUserName(currentUser?.name || currentUser?.email || "");
          } else {
            // Không có user data, clear token và chuyển sang guest mode
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("userData");
            setAuthToken(null);
            setIsLoggedIn(false);
            setUserName("");
          }
        } catch (apiErr) {
          // Token không hợp lệ hoặc đã hết hạn - đây là trường hợp bình thường cho guest users
          const errorMessage = apiErr.response?.data?.message || apiErr.message;
          if (errorMessage.includes("Invalid or expired token") || errorMessage.includes("No token")) {
            // Token hết hạn hoặc không hợp lệ - clear và chuyển sang guest mode
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("userData");
            setAuthToken(null);
            setIsLoggedIn(false);
            setUserName("");
          } else {
            // Lỗi khác - vẫn clear token để đảm bảo
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("userData");
            setAuthToken(null);
          setIsLoggedIn(false);
          setUserName("");
          }
        }
      } else {
        // Không có token - guest mode
        setIsLoggedIn(false);
        setUserName("");
      }
    } catch (err) {
      // Lỗi khi đọc AsyncStorage - chuyển sang guest mode
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
        try {
        setAuthToken(token);
        const response = await API.get("/cart");
        const cart = response.data.data;
        const totalItems = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        setCartCount(totalItems);
        } catch (cartErr) {
          // Token không hợp lệ hoặc lỗi khi lấy cart - fallback to guest cart
          const errorMessage = cartErr.response?.data?.message || cartErr.message;
          if (errorMessage.includes("Invalid or expired token") || errorMessage.includes("No token")) {
            // Token hết hạn - clear và dùng guest cart
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("userData");
            setAuthToken(null);
          }
          const guestCartCount = await getGuestCartCount();
          setCartCount(guestCartCount);
        }
      } else {
        // Không có token - sử dụng giỏ hàng cho khách vãng lai
        const guestCartCount = await getGuestCartCount();
        setCartCount(guestCartCount);
      }
    } catch (e) {
      // Lỗi khi đọc AsyncStorage hoặc guest cart - set về 0
      try {
      const guestCartCount = await getGuestCartCount();
      setCartCount(guestCartCount);
      } catch {
        setCartCount(0);
      }
    }
  };

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
        await loadCartCount();
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
      
      // Cập nhật số lượng giỏ hàng
      await loadCartCount();
      
      Alert.alert("Thành công", "Đã thêm sản phẩm vào giỏ hàng");
    } catch (error) {
      console.error("Error adding to cart:", error);
      const errorMessage = error.response?.data?.message || "Không thể thêm sản phẩm vào giỏ hàng";
      Alert.alert("Lỗi", errorMessage);
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
            console.log("ProductCard onPress - item:", item);
            console.log("ProductCard onPress - item._id:", item._id);
            
            if (!item || !item._id) {
              console.error("ProductCard onPress - item or item._id is missing");
              Alert.alert("Lỗi", "Không tìm thấy thông tin sản phẩm");
              return;
            }
            
            const productId = item._id?.toString() || item._id;
            console.log("Navigating to ProductDetail with productId:", productId);
            
            if (!productId) {
              console.error("ProductCard onPress - productId is still undefined");
              Alert.alert("Lỗi", "ID sản phẩm không hợp lệ");
              return;
            }
            
            navigation.navigate("ProductDetail", { productId });
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

      <Animated.ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Banner - Redesigned with 3D */}
        <Animated.View 
          style={styles.bannerContainer}
        >
          <Animated.View 
            style={[
              styles.banner,
              {
                height: bannerHeight,
                transform: [
                  {
                    rotateX: bannerRotateX.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['15deg', '0deg'],
                    }),
                  },
                  {
                    scale: bannerScale.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                  {
                    translateY: scrollY.interpolate({
                      inputRange: [-100, 0, 100],
                      outputRange: [20, 0, -20],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.bannerGradient, { padding: bannerPadding }]}>
              {/* Decorative Background Elements */}
              <View style={styles.bannerGlow1} />
              <View style={styles.bannerGlow2} />
              <View style={styles.bannerGlow3} />
              
              <Animated.View 
                style={[
                  styles.bannerContent,
                  {
                    opacity: bannerRotateX,
                    transform: [
                      {
                        translateY: bannerRotateX.interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {/* Premium Badge */}
                <Animated.View 
                  style={[
                    styles.bannerBadge,
                    {
                      transform: [
                        {
                          scale: bannerRotateX.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.badgeGlow} />
                  <Text style={styles.bannerBadgeIcon}>⚡</Text>
                  <Text style={[styles.bannerBadgeText, { fontSize: badgeFontSize }]}>HOT DEAL</Text>
                  <View style={styles.badgePulse} />
                </Animated.View>
                
                {/* Main Title with Gradient Effect */}
                <Animated.View
                  style={{
                    opacity: bannerRotateX,
                    transform: [
                      {
                        translateX: bannerRotateX.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <Text style={[styles.bannerTitle, { fontSize: titleFontSize, lineHeight: titleFontSize * 1.2 }]}>
                    <Text style={styles.bannerTitleGradient}>Khám phá</Text>
                    <Text style={styles.bannerTitleNormal}> công nghệ</Text>
                  </Text>
                </Animated.View>
                
                {/* Subtitle with better styling */}
                <Animated.View
                  style={{
                    opacity: bannerRotateX,
                    transform: [
                      {
                        translateX: bannerRotateX.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <Text style={[styles.bannerSubtitle, { fontSize: subtitleFontSize, lineHeight: subtitleFontSize * 1.4 }]}>
                    Trải nghiệm công nghệ đỉnh cao với sản phẩm chất lượng hàng đầu
                  </Text>
                </Animated.View>
                {/* Premium Stats Cards */}
                <Animated.View 
                  style={[
                    styles.bannerStats,
                    {
                      transform: [
                        {
                          rotateX: bannerRotateX.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['20deg', '0deg'],
                          }),
                        },
                        {
                          translateY: bannerRotateX.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                          }),
                        },
                        { perspective: 1000 },
                      ],
                      opacity: bannerRotateX,
                    },
                  ]}
                >
                  <Animated.View 
                    style={[
                      styles.statCard,
                      {
                        transform: [
                          {
                            rotateY: bannerRotateX.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['-15deg', '0deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.statIconContainer}>
                      <Text style={styles.statIcon}>📦</Text>
                </View>
                    <Text style={[styles.statNumber, { fontSize: statNumberSize }]}>30+</Text>
                    <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>Sản phẩm</Text>
                    <View style={styles.statGlow} />
                  </Animated.View>
                  
                  <Animated.View 
                    style={[
                      styles.statCard,
                      styles.statCardCenter,
                      {
                        transform: [
                          {
                            scale: bannerRotateX.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.9, 1],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={[styles.statIconContainer, styles.statIconContainerCenter]}>
                      <Text style={styles.statIcon}>👥</Text>
            </View>
                    <Text style={[styles.statNumber, { fontSize: statNumberSize }]}>50K+</Text>
                    <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>Khách hàng</Text>
                    <View style={styles.statGlow} />
                  </Animated.View>
                  
                  <Animated.View 
                    style={[
                      styles.statCard,
                      {
                        transform: [
                          {
                            rotateY: bannerRotateX.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['15deg', '0deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.statIconContainer}>
                      <Text style={styles.statIcon}>⭐</Text>
                    </View>
                    <Text style={[styles.statNumber, { fontSize: statNumberSize }]}>4.8</Text>
                    <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>Đánh giá</Text>
                    <View style={styles.statGlow} />
                  </Animated.View>
                </Animated.View>
                
                {/* Premium CTA Button */}
                <Animated.View
                  style={{
                    opacity: bannerRotateX,
                    transform: [
                      {
                        scale: bannerRotateX.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        }),
                      },
                    ],
                  }}
                >
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => navigation.navigate("Categories")}
                activeOpacity={0.8}
            >
                    <View style={styles.ctaButtonGlow} />
                    <Text style={[styles.ctaText, { fontSize: ctaFontSize }]}>Khám phá ngay</Text>
                    <Text style={[styles.ctaArrow, { fontSize: ctaFontSize + 4 }]}>→</Text>
                    <View style={styles.ctaShine} />
            </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Category Tabs with 3D */}
        <Animated.View 
          style={[
            styles.categoryTabsWrapper,
            {
              opacity: categoryTabsOpacity,
              transform: [
                {
                  translateY: categoryTabsTranslateY,
                },
                {
                  rotateX: categoryTabsOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['10deg', '0deg'],
                  }),
                },
              ],
            },
          ]}
        >
        <View style={styles.categoryTabsContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryTabsScrollContent}
            >
            <TouchableOpacity 
              style={[
                styles.categoryTab, 
                selectedCategory === "all" && styles.activeCategoryTab
              ]}
                onPress={() => {
                  setSelectedCategory("all");
                }}
                activeOpacity={0.7}
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
                  onPress={() => {
                    navigation.navigate("Categories", { categoryId: category._id });
                  }}
              />
            ))}
          </ScrollView>
          </View>
        </Animated.View>

        {/* Products by Category with Parallax */}
        <Animated.View 
          style={[
            styles.productsContainer,
            {
              transform: [
                {
                  translateY: scrollY.interpolate({
                    inputRange: [0, 300],
                    outputRange: [0, -50],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
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
                      onViewMore={(categoryId) => {
                        navigation.navigate("Categories", { categoryId });
                      }}
                      onProductPress={(product) => {
                        console.log("CategorySection onProductPress - product:", product);
                        console.log("CategorySection onProductPress - product._id:", product._id);
                        
                        if (!product || !product._id) {
                          console.error("CategorySection onProductPress - product or product._id is missing");
                          Alert.alert("Lỗi", "Không tìm thấy thông tin sản phẩm");
                          return;
                        }
                        
                        const productId = product._id?.toString() || product._id;
                        console.log("Navigating to ProductDetail with productId:", productId);
                        
                        if (!productId) {
                          console.error("CategorySection onProductPress - productId is still undefined");
                          Alert.alert("Lỗi", "ID sản phẩm không hợp lệ");
                          return;
                        }
                        
                        navigation.navigate("ProductDetail", { productId });
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
        </Animated.View>

        {/* Featured Section with 3D */}
        <Animated.View 
          style={[
            styles.megaSalesHeader,
            {
              transform: [
                {
                  translateY: scrollY.interpolate({
                    inputRange: [0, 400],
                    outputRange: [0, -30],
                    extrapolate: 'clamp',
                  }),
                },
                {
                  rotateX: scrollY.interpolate({
                    inputRange: [0, 400],
                    outputRange: ['0deg', '5deg'],
                    extrapolate: 'clamp',
                  }),
                },
                { perspective: 1000 },
              ],
            },
          ]}
        >
          <TouchableOpacity 
            style={styles.megaSalesContent}
            onPress={() => navigation.navigate("Categories")}
            activeOpacity={0.7}
          >
            <Text style={styles.megaSalesTitle}>Sản phẩm nổi bật</Text>
            <Text style={styles.megaSalesSubtitle}>Khám phá những sản phẩm hot nhất</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => navigation.navigate("Categories")}
            activeOpacity={0.8}
          >
            <Text style={styles.viewAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <View style={styles.bottomNavBorder} />
        <TouchableOpacity 
          style={[styles.navItem, styles.navItemActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, styles.navIconActive]}>■</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Trang chủ</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate("Categories")}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>□</Text>
          <Text style={styles.navLabel}>Danh mục</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate(isLoggedIn ? "OrderHistory" : "GuestCart")}
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
          <View style={styles.navIconWrapper}>
          <Text style={styles.navIcon}>▢</Text>
            {cartCount > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
              </View>
            )}
          </View>
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
  content: {
    flex: 1,
  },
  banner: {
    backgroundColor: "#0a0a0a",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 14,
    transform: [{ perspective: 1000 }],
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  bannerGradient: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    position: "relative",
    transform: [{ perspective: 1000 }],
  },
  bannerGlow1: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    blur: 60,
  },
  bannerGlow2: {
    position: "absolute",
    bottom: -30,
    left: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    blur: 50,
  },
  bannerGlow3: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    transform: [{ translateX: -50 }, { translateY: -50 }],
    blur: 40,
  },
  bannerContent: {
    alignItems: "flex-start",
    zIndex: 1,
  },
  bannerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#ef4444",
    alignSelf: "flex-start",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 24,
  },
  badgePulse: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#ef4444",
    opacity: 0.5,
  },
  bannerBadgeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  bannerBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    textShadowColor: "rgba(239, 68, 68, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  bannerTitle: {
    fontWeight: "900",
    marginBottom: 6,
    letterSpacing: -0.8,
  },
  bannerTitleGradient: {
    color: "#ef4444",
    textShadowColor: "rgba(239, 68, 68, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  bannerTitleNormal: {
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bannerSubtitle: {
    color: "#d1d5db",
    marginBottom: 12,
    fontWeight: "500",
    letterSpacing: 0.2,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bannerStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 6,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  statCardCenter: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
    transform: [{ scale: 1.03 }],
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  statIconContainerCenter: {
    backgroundColor: "rgba(239, 68, 68, 0.25)",
    borderColor: "#ef4444",
  },
  statIcon: {
    fontSize: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    color: "#ef4444",
    fontWeight: "900",
    marginBottom: 2,
    letterSpacing: 0.3,
    textShadowColor: "rgba(239, 68, 68, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  statLabel: {
    color: "#d1d5db",
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  statGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderRadius: 20,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 8,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    position: "relative",
    overflow: "hidden",
  },
  ctaButtonGlow: {
    position: "absolute",
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  ctaShine: {
    position: "absolute",
    top: 0,
    left: -100,
    width: 50,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.3)",
    transform: [{ skewX: "-20deg" }],
  },
  ctaText: {
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 0.8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginRight: 6,
  },
  ctaArrow: {
    color: "#fff",
    fontWeight: "900",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
  categoryTabsWrapper: {
    backgroundColor: "#0a0a0a",
    paddingVertical: 16,
    marginBottom: 16,
  },
  categoryTabsContainer: {
    paddingHorizontal: 16,
  },
  categoryTabsScrollContent: {
    paddingRight: 16,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: "#1a1a1a",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  activeCategoryTab: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
    shadowColor: "#ef4444",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryTabText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  activeCategoryTabText: {
    color: "#fff",
    fontWeight: "700",
  },
  categorySectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 16,
    marginTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "rgba(239, 68, 68, 0.2)",
  },
  categorySectionTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.5,
    textShadowColor: "rgba(239, 68, 68, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  categorySectionCount: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "700",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  megaSalesContent: {
    flex: 1,
  },
  megaSalesTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  megaSalesSubtitle: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "500",
  },
  viewAllButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  viewAllText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
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
  navIconWrapper: {
    position: "relative",
    marginBottom: 4,
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
  navBadge: {
    position: "absolute",
    right: -8,
    top: -6,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#0f0f0f",
  },
  navBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
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
  loadingText: {
    color: "#9ca3af",
    fontSize: 15,
    textAlign: "center",
    paddingVertical: 32,
    fontWeight: "500",
  },
  bannerContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  categoryTabsWrapper: {
    backgroundColor: "#0a0a0a",
    paddingVertical: 16,
    marginBottom: 16,
  },
  categoryTabsContainer: {
    paddingHorizontal: 16,
  },
  categoryTabsScrollContent: {
    paddingRight: 16,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: "#1a1a1a",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  activeCategoryTab: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
    shadowColor: "#ef4444",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryTabText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  activeCategoryTabText: {
    color: "#fff",
    fontWeight: "700",
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
  navIconWrapper: {
    position: "relative",
    marginBottom: 4,
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
  navBadge: {
    position: "absolute",
    right: -8,
    top: -6,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#0f0f0f",
  },
  navBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
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
  loadingText: {
    color: "#9ca3af",
    fontSize: 15,
    textAlign: "center",
    paddingVertical: 32,
    fontWeight: "500",
  },
  megaSalesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  megaSalesContent: {
    flex: 1,
  },
  megaSalesTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  megaSalesSubtitle: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "500",
  },
  viewAllButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  viewAllText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
