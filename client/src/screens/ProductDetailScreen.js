import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API, { setAuthToken, reviewAPI } from "../services/api";
import { imageUrl } from "../services/image";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { addToGuestCart } from "../services/guestCart";

export default function ProductDetailScreen({ navigation }) {
  const route = useRoute();
  const productId = route?.params?.productId || route?.params?.product?._id || route?.params?.id;
  const scrollViewRef = useRef(null);
  const descriptionRef = useRef(null);
  
  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const addToCartScale = useRef(new Animated.Value(1)).current;
  
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedRAM, setSelectedRAM] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [reviewFilter, setReviewFilter] = useState(0); // 0 = all, 1-5 = filter by rating
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // Helper function: Kiểm tra category có cần RAM không
  const categoryRequiresRAM = () => {
    if (!product?.category_id) return false;
    const categoryName = (product.category_id?.name || "").toLowerCase();
    // Các category cần RAM: Laptop, Máy tính, PC
    return categoryName.includes("laptop") || 
           categoryName.includes("máy tính") || 
           categoryName.includes("pc") ||
           categoryName.includes("computer");
  };
  
  const requiresRAM = categoryRequiresRAM();
  
  // Lấy danh sách unique colors, sizes, RAMs từ variations
  const getUniqueOptions = () => {
    if (!product?.variations || product.variations.length === 0) {
      return { colors: [], sizes: [], rams: [] };
    }
    
    const colors = [...new Set(product.variations.map(v => v.color).filter(Boolean))];
    const sizes = [...new Set(product.variations.map(v => v.size).filter(Boolean))];
    const rams = [...new Set(product.variations.map(v => v.ram).filter(Boolean))];
    
    return { colors, sizes, rams };
  };
  
  const { colors, sizes, rams } = getUniqueOptions();
  
  // Tìm variation phù hợp với các lựa chọn
  const findMatchingVariation = () => {
    if (!product?.variations) return null;
    
    return product.variations.find(v => {
      const colorMatch = !selectedColor || v.color === selectedColor;
      const sizeMatch = !selectedSize || v.size === selectedSize;
      const ramMatch = !selectedRAM || v.ram === selectedRAM;
      return colorMatch && sizeMatch && ramMatch;
    });
  };
  
  const selectedVariation = findMatchingVariation();

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
  });

  const getProductIdString = () => {
    if (!productId) return null;
    if (typeof productId === 'string') return productId;
    if (productId?.toString) return productId.toString();
    return null;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const idString = getProductIdString();
      if (!idString) {
        Alert.alert("Lỗi", "Không tìm thấy ID sản phẩm");
        navigation.goBack();
        return;
      }
      loadProduct();
      checkLoginStatus();
    }, 100);
    return () => clearTimeout(timer);
  }, [productId, route?.params]);

  useFocusEffect(
    React.useCallback(() => {
      const idString = getProductIdString();
      if (idString) {
        loadReviews();
        if (isLoggedIn) {
          loadUserReview();
        }
      }
    }, [productId, isLoggedIn])
  );

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        setAuthToken(token);
        const response = await API.get("/auth/users/me");
        setUser(response?.data?.data);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (err) {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  const loadProduct = async () => {
    try {
      const idString = getProductIdString();
      if (!idString) {
        Alert.alert("Lỗi", "Không tìm thấy sản phẩm");
        navigation.goBack();
        return;
      }
      
      setLoading(true);
      const response = await API.get(`/products/${idString}`);
      
      if (response.data.success && response.data.data) {
        const productData = response.data.data;
        setProduct(productData);
        if (productData.variations && productData.variations.length > 0) {
          // Tự động chọn variation đầu tiên có stock > 0
          const firstAvailable = productData.variations.find(v => (v.stock || 0) > 0) || productData.variations[0];
          if (firstAvailable) {
            setSelectedColor(firstAvailable.color || null);
            setSelectedSize(firstAvailable.size || null);
            setSelectedRAM(firstAvailable.ram || null);
          }
        }
        
        // Start animations
        Animated.parallel([
          Animated.timing(imageOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(cardScale, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 600,
            delay: 200,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        throw new Error("Product data not found in response");
      }
    } catch (err) {
      Alert.alert("Lỗi", err.response?.data?.message || "Không thể tải thông tin sản phẩm");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const idString = getProductIdString();
      if (!idString) return;
      
      const response = await reviewAPI.getProductReviews(idString);
      const list = response?.data?.data || [];
      setReviews(list.filter(Boolean)); // tránh phần tử null gây lỗi _id
    } catch (err) {
      if (err.response?.status !== 400 && err.response?.status !== 404) {
        console.error("Error loading reviews:", err);
      }
    }
  };

  const loadUserReview = async () => {
    try {
      const idString = getProductIdString();
      if (!idString) return;
      
      const response = await reviewAPI.getUserReview(idString);
      if (response?.data?.data) {
        setUserReview(response.data.data);
        setReviewForm({
          rating: response.data.data.rating,
          comment: response.data.data.comment,
        });
      } else {
        setUserReview(null);
      }
    } catch (err) {
      if (err.response?.status !== 404 && err.response?.status !== 400) {
        console.error("Error loading user review:", err);
      }
      setUserReview(null);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    // Kiểm tra nếu có variations thì phải chọn đầy đủ
    if (product.variations && product.variations.length > 0) {
      if (!selectedColor) {
        Alert.alert("Thông báo", "Vui lòng chọn màu sắc trước khi thêm vào giỏ hàng");
        return;
      }
      if (requiresRAM && !selectedRAM) {
        Alert.alert("Thông báo", "Vui lòng chọn RAM trước khi thêm vào giỏ hàng");
        return;
      }
      if (!selectedVariation) {
        Alert.alert("Thông báo", "Không tìm thấy biến thể phù hợp với lựa chọn của bạn");
        return;
      }
      if ((selectedVariation.stock || 0) === 0) {
        Alert.alert("Thông báo", "Biến thể này đã hết hàng");
        return;
      }
    }

    // Kiểm tra tồn kho trước khi thêm
    const availableStock = selectedVariation?.stock || product.in_stock || 0;
    if (availableStock === 0) {
      Alert.alert("Thông báo", "Sản phẩm này đã hết hàng");
      return;
    }

    try {
      setAddingToCart(true);
      
      // Tạo variation object nếu có
      const variation = selectedVariation ? {
        color: selectedVariation.color,
        size: selectedVariation.size,
        ram: selectedVariation.ram
      } : {};

      if (!isLoggedIn) {
        // Kiểm tra guest cart xem đã có sản phẩm này chưa
        const { getGuestCart } = require("../services/guestCart");
        const guestCart = await getGuestCart();
        const existingItem = guestCart.find(item => {
          const sameProduct = item.product_id?._id === product._id || item.product_id === product._id;
          const itemVariation = item.variation || {};
          const sameVariation = JSON.stringify(itemVariation) === JSON.stringify(variation || {});
          return sameProduct && sameVariation;
        });

        if (existingItem) {
          const newQuantity = existingItem.quantity + 1;
          if (newQuantity > availableStock) {
            Alert.alert(
              "Không đủ hàng",
              `Số lượng sản phẩm không đủ trong kho. Hiện có ${existingItem.quantity} trong giỏ, thêm 1 sẽ vượt quá số lượng còn lại (${availableStock} sản phẩm)`
            );
            setAddingToCart(false);
            return;
          }
        }

        await addToGuestCart(product, 1, variation);
        Alert.alert("Thành công", "Đã thêm sản phẩm vào giỏ hàng");
        setAddingToCart(false);
        return;
      }

      const token = await AsyncStorage.getItem("token");
      setAuthToken(token);
      
      // Kiểm tra giỏ hàng hiện tại trước khi thêm
      try {
        const cartResponse = await API.get("/cart");
        const cart = cartResponse.data.data;
        const existingItem = cart.items?.find(item => {
          const sameProduct = item.product_id?.toString() === product._id?.toString();
          const itemVariation = item.variation || {};
          const sameVariation = JSON.stringify(itemVariation) === JSON.stringify(variation);
          return sameProduct && sameVariation;
        });

        if (existingItem) {
          const newQuantity = existingItem.quantity + 1;
          if (newQuantity > availableStock) {
            Alert.alert(
              "Không đủ hàng",
              `Số lượng sản phẩm không đủ trong kho. Hiện có ${existingItem.quantity} trong giỏ, thêm 1 sẽ vượt quá số lượng còn lại (${availableStock} sản phẩm)`
            );
            setAddingToCart(false);
            return;
          }
        }
      } catch (cartErr) {
        // Nếu không lấy được cart, tiếp tục thêm vào giỏ hàng
        // Backend sẽ validate
      }

      await API.post("/cart", {
        product_id: product._id,
        quantity: 1,
        variation: variation,
      });
      
      Alert.alert("Thành công", "Đã thêm sản phẩm vào giỏ hàng");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Không thể thêm sản phẩm vào giỏ hàng";
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!isLoggedIn) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để đánh giá sản phẩm", [
        { text: "Hủy", style: "cancel" },
        { text: "Đăng nhập", onPress: () => navigation.navigate("Login") },
      ]);
      return;
    }

    if (!reviewForm.comment.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đánh giá");
      return;
    }

    const idString = getProductIdString();
    if (!idString) {
      Alert.alert("Lỗi", "Không tìm thấy sản phẩm");
      return;
    }

    try {
      setSubmittingReview(true);
      const token = await AsyncStorage.getItem("token");
      setAuthToken(token);
      
      await reviewAPI.createOrUpdateReview(idString, {
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      });

      Alert.alert("Thành công", userReview ? "Đã cập nhật đánh giá" : "Đã thêm đánh giá");
      setShowReviewForm(false);
      await loadReviews();
      await loadUserReview();
    } catch (err) {
      Alert.alert("Lỗi", err.response?.data?.message || "Không thể gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn xóa đánh giá này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token");
            setAuthToken(token);
            await reviewAPI.deleteReview(userReview._id);
            Alert.alert("Thành công", "Đã xóa đánh giá");
            setUserReview(null);
            setReviewForm({ rating: 5, comment: "" });
            setShowReviewForm(false);
            await loadReviews();
          } catch (err) {
            Alert.alert("Lỗi", "Không thể xóa đánh giá");
          }
        },
      },
    ]);
  };

  const renderStars = (rating, size = 16) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text key={star} style={[styles.star, { fontSize: size }]}>
            {star <= rating ? "⭐" : "☆"}
          </Text>
        ))}
      </View>
    );
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });
    return distribution;
  };

  const getFilteredReviews = () => {
    if (reviewFilter === 0) return reviews;
    return reviews.filter((review) => review.rating === reviewFilter);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy sản phẩm</Text>
        </View>
      </SafeAreaView>
    );
  }

  const avgRating = calculateAverageRating();
  const availableStock = selectedVariation?.stock || product.in_stock || 0;
  const ratingDistribution = getRatingDistribution();
  const filteredReviews = getFilteredReviews();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: scrollY.interpolate({
                inputRange: [0, 100],
                outputRange: [1, 0.95],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
          </View>
          <View style={styles.placeholder} />
        </Animated.View>

        <Animated.ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {/* Product Image */}
          <Animated.View 
            style={[
              styles.imageSection,
              {
                opacity: imageOpacity,
                transform: [
                  {
                    translateY: scrollY.interpolate({
                      inputRange: [-100, 0, 100],
                      outputRange: [0, 0, -50],
                      extrapolate: 'clamp',
                    }),
                  },
                  {
                    scale: scrollY.interpolate({
                      inputRange: [-100, 0, 100],
                      outputRange: [1, 1, 1.1],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.imageContainer}>
              <Animated.Image
                source={
                  product.imageUrl
                    ? { uri: imageUrl(product.imageUrl) }
                    : require("../../assets/depositphotos_57530297-stock-illustration-shopping-cart-icon.jpg")
                }
                style={[
                  styles.productImage,
                  {
                    opacity: imageOpacity,
                  },
                ]}
                resizeMode="cover"
              />
              <View style={styles.imageGradientOverlay} />
              <View style={styles.imageGlow1} />
              <View style={styles.imageGlow2} />
              <Animated.View 
                style={[
                  styles.imageBadge,
                  {
                    opacity: imageOpacity,
                    transform: [
                      {
                        translateY: imageOpacity.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.imageBadgeIcon}>🏷️</Text>
                <Text style={styles.imageBadgeText}>
                  {product.category_id?.name || "Sản phẩm"}
                </Text>
              </Animated.View>
            </View>
          </Animated.View>

          {/* Product Info Card */}
          <Animated.View 
            style={[
              styles.productInfoCard,
              {
                opacity: cardOpacity,
                transform: [
                  {
                    scale: cardScale,
                  },
                  {
                    translateY: scrollY.interpolate({
                      inputRange: [0, 200],
                      outputRange: [0, -20],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.categoryBadge}>
              <View style={styles.categoryBadgeGlow} />
              <Text style={styles.categoryBadgeText}>
                {product.category_id?.name || "Danh mục"}
              </Text>
            </View>
            
            <Text style={styles.productName}>{product.name}</Text>
            
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.productPrice}>
                  {product.price?.toLocaleString("vi-VN")}đ
                </Text>
                <View style={styles.priceUnderline} />
              </View>
              {availableStock > 0 ? (
                <Animated.View 
                  style={[
                    styles.stockBadge,
                    {
                      transform: [
                        {
                          scale: cardOpacity.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.stockDot} />
                  <Text style={styles.stockBadgeText}>Còn hàng</Text>
                  <View style={styles.stockPulse} />
                </Animated.View>
              ) : (
                <View style={[styles.stockBadge, styles.stockBadgeOut]}>
                  <View style={[styles.stockDot, styles.stockDotOut]} />
                  <Text style={[styles.stockBadgeText, styles.stockBadgeTextOut]}>Hết hàng</Text>
                </View>
              )}
            </View>

            <View ref={descriptionRef} collapsable={false}>
              <View ref={descriptionRef} collapsable={false}>
              <Text style={styles.productDescription}>{product.description}</Text>
            </View>
            </View>

            {/* Variations - Tách riêng màu sắc, size và RAM */}
            {product.variations && product.variations.length > 0 && (
              <View style={styles.variationsSection}>
                {/* Chọn màu sắc */}
                {colors.length > 0 && (
                  <View style={styles.variationGroup}>
                    <Text style={styles.sectionLabel}>Màu sắc *</Text>
                    <View style={styles.variationsGrid}>
                      {colors.map((color, index) => {
                        const hasStock = product.variations.some(v => 
                          v.color === color && 
                          (!selectedSize || v.size === selectedSize) &&
                          (!selectedRAM || v.ram === selectedRAM) &&
                          (v.stock || 0) > 0
                        );
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.variationChip,
                              selectedColor === color && styles.variationChipSelected,
                              !hasStock && styles.variationChipDisabled,
                            ]}
                            onPress={() => setSelectedColor(color)}
                            disabled={!hasStock}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.variationChipText,
                                selectedColor === color && styles.variationChipTextSelected,
                                !hasStock && styles.variationChipTextDisabled,
                              ]}
                            >
                              {color}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Chọn dung lượng (size) */}
                {sizes.length > 0 && (
                  <View style={styles.variationGroup}>
                    <Text style={styles.sectionLabel}>Dung lượng</Text>
                    <View style={styles.variationsGrid}>
                      <TouchableOpacity
                        style={[
                          styles.variationChip,
                          !selectedSize && styles.variationChipSelected,
                        ]}
                        onPress={() => setSelectedSize(null)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.variationChipText,
                            !selectedSize && styles.variationChipTextSelected,
                          ]}
                        >
                          Tất cả
                        </Text>
                      </TouchableOpacity>
                      {sizes.map((size, index) => {
                        const hasStock = product.variations.some(v => 
                          (!selectedColor || v.color === selectedColor) &&
                          v.size === size &&
                          (!selectedRAM || v.ram === selectedRAM) &&
                          (v.stock || 0) > 0
                        );
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.variationChip,
                              selectedSize === size && styles.variationChipSelected,
                              !hasStock && styles.variationChipDisabled,
                            ]}
                            onPress={() => setSelectedSize(size)}
                            disabled={!hasStock}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.variationChipText,
                                selectedSize === size && styles.variationChipTextSelected,
                                !hasStock && styles.variationChipTextDisabled,
                              ]}
                            >
                              {size}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Chọn RAM */}
                {(requiresRAM || rams.length > 0) && (
                  <View style={styles.variationGroup}>
                    <Text style={styles.sectionLabel}>
                      RAM {requiresRAM ? "*" : ""}
                    </Text>
                    <View style={styles.variationsGrid}>
                      {!requiresRAM && (
                        <TouchableOpacity
                          style={[
                            styles.variationChip,
                            !selectedRAM && styles.variationChipSelected,
                          ]}
                          onPress={() => setSelectedRAM(null)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.variationChipText,
                              !selectedRAM && styles.variationChipTextSelected,
                            ]}
                          >
                            Tất cả
                          </Text>
                        </TouchableOpacity>
                      )}
                      {rams.map((ram, index) => {
                        const hasStock = product.variations.some(v => 
                          (!selectedColor || v.color === selectedColor) &&
                          (!selectedSize || v.size === selectedSize) &&
                          v.ram === ram &&
                          (v.stock || 0) > 0
                        );
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.variationChip,
                              selectedRAM === ram && styles.variationChipSelected,
                              !hasStock && styles.variationChipDisabled,
                            ]}
                            onPress={() => setSelectedRAM(ram)}
                            disabled={!hasStock}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.variationChipText,
                                selectedRAM === ram && styles.variationChipTextSelected,
                                !hasStock && styles.variationChipTextDisabled,
                              ]}
                            >
                              {ram}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Hiển thị thông tin variation đã chọn */}
                {selectedVariation && (
                  <View style={styles.selectedVariationInfo}>
                    <View style={styles.selectedVariationHeader}>
                      <Text style={styles.selectedVariationLabel}>✓ Đã chọn</Text>
                      <View style={styles.selectedVariationBadge}>
                        <Text style={styles.selectedVariationBadgeText}>
                          {selectedVariation.color}
                          {selectedVariation.size && ` • ${selectedVariation.size}`}
                          {selectedVariation.ram && ` • ${selectedVariation.ram} RAM`}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.selectedVariationStockContainer}>
                      <Text style={styles.selectedVariationStockLabel}>Tồn kho:</Text>
                      <Text style={styles.selectedVariationStock}>
                        {selectedVariation.stock || 0} sản phẩm
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Stock Info */}
            <View style={styles.stockInfo}>
              <Text style={styles.stockLabel}>Tồn kho:</Text>
              <Text style={styles.stockValue}>{availableStock} sản phẩm</Text>
            </View>
          </Animated.View>

          {/* Add to Cart Button */}
          <Animated.View
            style={[
              styles.addToCartContainer,
              {
                transform: [
                  {
                    scale: addToCartScale,
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.addToCartButton,
                (availableStock === 0 || addingToCart) && styles.addToCartButtonDisabled,
              ]}
              onPress={() => {
                Animated.sequence([
                  Animated.spring(addToCartScale, {
                    toValue: 0.95,
                    useNativeDriver: true,
                  }),
                  Animated.spring(addToCartScale, {
                    toValue: 1,
                    useNativeDriver: true,
                  }),
                ]).start();
                handleAddToCart();
              }}
              disabled={availableStock === 0 || addingToCart}
              activeOpacity={0.8}
            >
              <View style={styles.addToCartButtonGlow} />
              {addingToCart ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.addToCartText}>
                    {availableStock === 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
                  </Text>
                  <Text style={styles.addToCartIcon}>🛒</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Reviews Section */}
          <View style={styles.reviewsCard}>
            {/* Reviews Header */}
            <View style={styles.reviewsHeader}>
              <View style={styles.reviewsHeaderLeft}>
                <Text style={styles.reviewsTitle}>Đánh giá sản phẩm</Text>
                <View style={styles.ratingSummary}>
                  <Text style={styles.avgRating}>{avgRating}</Text>
                  {renderStars(parseFloat(avgRating), 20)}
                  <Text style={styles.reviewsCount}>({reviews.length} đánh giá)</Text>
                </View>
              </View>
              {isLoggedIn && !userReview && (
                <TouchableOpacity
                  style={styles.writeReviewButton}
                  onPress={() => setShowReviewForm(!showReviewForm)}
                  activeOpacity={0.8}
                >
                  <View style={styles.writeReviewButtonContent}>
                    <Text style={styles.writeReviewButtonIcon}>
                      {showReviewForm ? "✕" : "✎"}
                    </Text>
                    <Text style={styles.writeReviewButtonText}>
                      {showReviewForm ? "Hủy" : "Viết đánh giá"}
                    </Text>
                  </View>
                  <View style={styles.writeReviewButtonGlow} />
                </TouchableOpacity>
              )}
            </View>

            {/* Rating Distribution */}
            {reviews.length > 0 && (
              <View style={styles.ratingDistribution}>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = ratingDistribution[rating] || 0;
                  const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingBarRow,
                        reviewFilter === rating && styles.ratingBarRowActive,
                      ]}
                      onPress={() => setReviewFilter(reviewFilter === rating ? 0 : rating)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.ratingBarLabel}>
                        <Text style={styles.ratingBarText}>{rating} ⭐</Text>
                        <Text style={styles.ratingBarCount}>({count})</Text>
                      </View>
                      <View style={styles.ratingBarContainer}>
                        <View
                          style={[
                            styles.ratingBarFill,
                            { width: `${percentage}%` },
                            reviewFilter === rating && styles.ratingBarFillActive,
                          ]}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {reviewFilter > 0 && (
                  <TouchableOpacity
                    style={styles.clearFilterButton}
                    onPress={() => setReviewFilter(0)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.clearFilterText}>Xóa bộ lọc</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Review Form */}
            {isLoggedIn && (showReviewForm || userReview) && (
              <View style={styles.reviewFormCard}>
                <View style={styles.reviewFormHeader}>
                  <Text style={styles.reviewFormTitle}>
                    {userReview ? "Đánh giá của bạn" : "Viết đánh giá"}
                  </Text>
                  {userReview && (
                    <TouchableOpacity
                      style={styles.editReviewButton}
                      onPress={() => setShowReviewForm(!showReviewForm)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.editReviewButtonText}>
                        {showReviewForm ? "Hủy" : "Chỉnh sửa"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {showReviewForm && (
                  <>
                    <View style={styles.ratingInput}>
                      <Text style={styles.ratingLabel}>Đánh giá:</Text>
                      <View style={styles.starSelector}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <TouchableOpacity
                            key={star}
                            onPress={() =>
                              setReviewForm({ ...reviewForm, rating: star })
                            }
                            activeOpacity={0.7}
                          >
                            <Text style={styles.starSelectorStar}>
                              {star <= reviewForm.rating ? "⭐" : "☆"}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <TextInput
                      style={styles.commentInput}
                      value={reviewForm.comment}
                      onChangeText={(text) =>
                        setReviewForm({ ...reviewForm, comment: text })
                      }
                      placeholder="Nhập đánh giá của bạn..."
                      placeholderTextColor="#6b7280"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                    <View style={styles.reviewFormButtons}>
                      <TouchableOpacity
                        style={styles.submitReviewButton}
                        onPress={handleSubmitReview}
                        disabled={submittingReview}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.submitReviewText}>
                          {submittingReview
                            ? "Đang gửi..."
                            : userReview
                            ? "Cập nhật"
                            : "Gửi đánh giá"}
                        </Text>
                      </TouchableOpacity>
                      {userReview && (
                        <TouchableOpacity
                          style={styles.deleteReviewButton}
                          onPress={handleDeleteReview}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.deleteReviewText}>Xóa</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}
                
                {!showReviewForm && userReview && (
                  <View style={styles.userReviewDisplay}>
                    <View style={styles.userReviewHeader}>
                      <View style={styles.userReviewInfo}>
                        {renderStars(userReview.rating, 16)}
                        <Text style={styles.userReviewDate}>
                          {new Date(userReview.createdAt).toLocaleDateString("vi-VN")}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.userReviewComment}>{userReview.comment}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Reviews List */}
            <View style={styles.reviewsList}>
              {filteredReviews.length === 0 ? (
                <View style={styles.noReviewsContainer}>
                  <Text style={styles.noReviewsText}>
                    {reviewFilter > 0
                      ? `Không có đánh giá ${reviewFilter} sao`
                      : "Chưa có đánh giá nào cho sản phẩm này"}
                  </Text>
                </View>
              ) : (
                filteredReviews.map((review) => {
                  if (!review) return null;
                  return (
                  <View key={review._id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewUserInfo}>
                        <View style={styles.reviewAvatar}>
                          <Text style={styles.reviewAvatarText}>
                            {review.user_id?.name?.charAt(0)?.toUpperCase() || "U"}
                          </Text>
                        </View>
                        <View style={styles.reviewUserDetails}>
                          <Text style={styles.reviewUserName}>
                            {review.user_id?.name || "Người dùng"}
                          </Text>
                          {review.verified_purchase && (
                            <View style={styles.verifiedBadge}>
                              <Text style={styles.verifiedBadgeText}>✓ Đã mua hàng</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.reviewRating}>
                        {renderStars(review.rating, 14)}
                        <Text style={styles.reviewDate}>
                          {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </View>
                  );
                })
              )}
            </View>
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(239, 68, 68, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.3)",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
    textShadowColor: "rgba(239, 68, 68, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  imageSection: {
    width: "100%",
    marginBottom: 0,
  },
  imageContainer: {
    width: "100%",
    height: 500,
    backgroundColor: "#0a0a0a",
    position: "relative",
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  imageGradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  imageGlow1: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    blur: 60,
  },
  imageGlow2: {
    position: "absolute",
    bottom: -30,
    left: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    blur: 50,
  },
  imageBadge: {
    position: "absolute",
    top: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "rgba(239, 68, 68, 0.4)",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
    gap: 8,
  },
  imageBadgeIcon: {
    fontSize: 18,
  },
  imageBadgeText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
    textShadowColor: "rgba(239, 68, 68, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  productInfoCard: {
    margin: 16,
    marginTop: -50,
    padding: 28,
    backgroundColor: "#1a1a1a",
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.2)",
    shadowColor: "#ef4444",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
    zIndex: 10,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    position: "relative",
    overflow: "hidden",
  },
  categoryBadgeGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    position: "relative",
    zIndex: 1,
  },
  productName: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 16,
    letterSpacing: -0.5,
    lineHeight: 36,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  productPrice: {
    color: "#ef4444",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 0.5,
    textShadowColor: "rgba(239, 68, 68, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  priceUnderline: {
    height: 3,
    backgroundColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 2,
    marginTop: 4,
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#10b981",
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    position: "relative",
    overflow: "hidden",
  },
  stockBadgeOut: {
    backgroundColor: "#ef4444",
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#ef4444",
  },
  stockDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ffffff",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  stockDotOut: {
    backgroundColor: "#ffffff",
  },
  stockBadgeText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  stockBadgeTextOut: {
    color: "#ffffff",
  },
  stockPulse: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#10b981",
    opacity: 0.5,
  },
  productDescription: {
    color: "#d1d5db",
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 20,
  },
  variationsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  sectionLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  variationsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  variationChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#0a0a0a",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  variationChipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  variationChipSelected: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
    shadowColor: "#ef4444",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.05 }],
  },
  variationChipDisabled: {
    opacity: 0.5,
  },
  variationChipText: {
    color: "#d1d5db",
    fontSize: 14,
    fontWeight: "500",
  },
  variationChipTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  variationChipTextDisabled: {
    color: "#6b7280",
  },
  variationStock: {
    color: "#9ca3af",
    fontSize: 12,
  },
  variationStockSelected: {
    color: "#ffffff",
  },
  selectedVariationInfo: {
    marginTop: 20,
    padding: 18,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.3)",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedVariationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  selectedVariationLabel: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
    textShadowColor: "rgba(239, 68, 68, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  selectedVariationBadge: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  selectedVariationBadgeText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  selectedVariationStockContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectedVariationStockLabel: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
  },
  selectedVariationStock: {
    color: "#10b981",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  stockInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  stockLabel: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
  stockValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  addToCartContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  addToCartButton: {
    backgroundColor: "#ef4444",
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
    shadowColor: "#ef4444",
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    position: "relative",
    overflow: "hidden",
  },
  addToCartButtonGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
  },
  addToCartButtonDisabled: {
    backgroundColor: "#2a2a2a",
    borderColor: "#1a1a1a",
    shadowOpacity: 0,
  },
  addToCartText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    position: "relative",
    zIndex: 1,
  },
  addToCartIcon: {
    fontSize: 20,
    position: "relative",
    zIndex: 1,
  },
  reviewsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 24,
    backgroundColor: "#1a1a1a",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.2)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  reviewsHeaderLeft: {
    flex: 1,
  },
  reviewsTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 14,
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  ratingSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avgRating: {
    color: "#ef4444",
    fontSize: 32,
    fontWeight: "900",
    textShadowColor: "rgba(239, 68, 68, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  reviewsCount: {
    color: "#9ca3af",
    fontSize: 14,
  },
  writeReviewButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#ef4444",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
    position: "relative",
    overflow: "hidden",
  },
  writeReviewButtonGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
  },
  writeReviewButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    position: "relative",
    zIndex: 1,
  },
  writeReviewButtonIcon: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  writeReviewButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ratingDistribution: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  ratingBarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#0a0a0a",
  },
  ratingBarRowActive: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  ratingBarLabel: {
    flexDirection: "row",
    alignItems: "center",
    width: 80,
    gap: 6,
  },
  ratingBarText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  ratingBarCount: {
    color: "#9ca3af",
    fontSize: 12,
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "#2a2a2a",
    borderRadius: 4,
    marginLeft: 12,
    overflow: "hidden",
  },
  ratingBarFill: {
    height: "100%",
    backgroundColor: "#ef4444",
    borderRadius: 4,
  },
  ratingBarFillActive: {
    backgroundColor: "#f59e0b",
  },
  clearFilterButton: {
    alignSelf: "flex-end",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#2a2a2a",
    borderRadius: 6,
  },
  clearFilterText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
  },
  reviewFormCard: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#0a0a0a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  reviewFormHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  reviewFormTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  editReviewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#2a2a2a",
    borderRadius: 6,
  },
  editReviewButtonText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
  },
  ratingInput: {
    marginBottom: 16,
  },
  ratingLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  starSelector: {
    flexDirection: "row",
    gap: 4,
  },
  starSelectorStar: {
    fontSize: 28,
  },
  commentInput: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    color: "#ffffff",
    fontSize: 15,
    minHeight: 100,
    marginBottom: 16,
  },
  reviewFormButtons: {
    flexDirection: "row",
    gap: 12,
  },
  submitReviewButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitReviewText: {
    color: "#0a0a0a",
    fontSize: 15,
    fontWeight: "700",
  },
  deleteReviewButton: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  deleteReviewText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  userReviewDisplay: {
    paddingTop: 12,
  },
  userReviewHeader: {
    marginBottom: 12,
  },
  userReviewInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userReviewDate: {
    color: "#9ca3af",
    fontSize: 12,
  },
  userReviewComment: {
    color: "#d1d5db",
    fontSize: 14,
    lineHeight: 22,
  },
  reviewsList: {
    marginTop: 20,
  },
  noReviewsContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  noReviewsText: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
  },
  reviewCard: {
    padding: 18,
    backgroundColor: "#0a0a0a",
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  reviewUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  reviewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  reviewAvatarText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  reviewUserDetails: {
    flex: 1,
  },
  reviewUserName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  verifiedBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "#10b981",
    borderRadius: 6,
  },
  verifiedBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  reviewRating: {
    alignItems: "flex-end",
  },
  reviewDate: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
  },
  reviewComment: {
    color: "#d1d5db",
    fontSize: 14,
    lineHeight: 22,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  star: {
    marginRight: 0,
  },
});
