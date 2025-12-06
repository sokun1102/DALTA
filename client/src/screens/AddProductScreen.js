import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Image, Modal, FlatList, Platform, SafeAreaView, KeyboardAvoidingView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API, { setAuthToken } from "../services/api";
import { imageUrl } from "../services/image";

export default function AddProductScreen({ navigation, route }) {
  // Nếu là update thì lấy product từ route.params
  const updateMode = !!route?.params?.product;
  const product = route?.params?.product || {};
  const [formData, setFormData] = useState({
    name: product.name || "",
    description: product.description || "",
    price: product.price?.toString() || "",
    sku: product.sku || "",
    in_stock: product.in_stock?.toString() || "",
    category_id: product.category_id?._id || "",
    imageUrl: product.imageUrl || "",
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [catModal, setCatModal] = useState(false);
  
  // Helper function: Kiểm tra category có cần RAM không
  const categoryRequiresRAM = (categoryId) => {
    if (!categoryId) return false;
    const category = categories.find(cat => cat._id === categoryId || cat._id?.toString() === categoryId);
    if (!category) return false;
    const categoryName = category.name?.toLowerCase() || "";
    // Các category cần RAM: Laptop, Máy tính, PC
    return categoryName.includes("laptop") || 
           categoryName.includes("máy tính") || 
           categoryName.includes("pc") ||
           categoryName.includes("computer");
  };
  
  const requiresRAM = categoryRequiresRAM(formData.category_id);
  const [variations, setVariations] = useState(
    product.variations?.length > 0 
      ? product.variations.map(v => ({ 
          color: v.color || "", 
          size: v.size || "",
          ram: v.ram || "",
          stock: v.stock?.toString() || "0" 
        }))
      : [{ color: "", size: "", ram: "", stock: "0" }]
  );

  useEffect(() => {
    fetchCategories();
    checkUserRole();
  }, []);

  // Set lại form nếu chuyển sản phẩm khi sửa
  useEffect(() => {
    if (updateMode && product?._id) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        sku: product.sku || "",
        in_stock: product.in_stock?.toString() || "",
        category_id: product.category_id?._id || "",
        imageUrl: product.imageUrl || "",
      });
      // Load variations
      if (product.variations && product.variations.length > 0) {
        setVariations(
          product.variations.map(v => ({ 
            color: v.color || "",
            size: v.size || "",
            ram: v.ram || "",
            stock: v.stock?.toString() || "0" 
          }))
        );
      } else {
        setVariations([{ color: "", size: "", ram: "", stock: "0" }]);
      }
    }
    // eslint-disable-next-line
  }, [product?._id]);

  const checkUserRole = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        setAuthToken(token);
        const meRes = await API.get("/auth/users/me");
        const currentUser = meRes?.data?.data;
        setUserRole(currentUser?.role || "user");
        if (currentUser?.role !== "admin") {
          Alert.alert("Không có quyền", "Chỉ admin mới có thể thao tác sản phẩm");
          navigation.goBack();
        }
      } else {
        Alert.alert("Chưa đăng nhập", "Vui lòng đăng nhập để tiếp tục");
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert("Lỗi", "Không thể kiểm tra quyền người dùng");
      navigation.goBack();
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await API.get("/categories");
      setCategories(response.data.data || []);
    } catch (err) {
      Alert.alert("Lỗi", "Không thể tải danh mục");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Quản lý variations
  const addVariation = () => {
    setVariations([...variations, { color: "", size: "", ram: "", stock: "0" }]);
  };

  const removeVariation = (index) => {
    if (variations.length > 1) {
      setVariations(variations.filter((_, i) => i !== index));
    } else {
      Alert.alert("Lỗi", "Phải có ít nhất 1 biến thể");
    }
  };

  const updateVariation = (index, field, value) => {
    const updated = [...variations];
    updated[index] = { ...updated[index], [field]: value };
    setVariations(updated);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.description || !formData.price || 
        !formData.sku || !formData.in_stock || !formData.category_id) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin"); return;
    }
    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      Alert.alert("Lỗi", "Giá sản phẩm phải là số dương"); return;
    }
    if (isNaN(parseInt(formData.in_stock)) || parseInt(formData.in_stock) < 0) {
      Alert.alert("Lỗi", "Số lượng tồn kho phải là số không âm"); return;
    }

    // Validate variations
    const validVariations = variations
      .filter(v => {
        // Bắt buộc có màu sắc
        if (!v.color.trim()) return false;
        // Nếu category yêu cầu RAM thì bắt buộc có RAM
        if (requiresRAM && !v.ram?.trim()) {
          Alert.alert("Lỗi", "Sản phẩm này yêu cầu phải có RAM cho mỗi biến thể");
          return false;
        }
        return true;
      })
      .map(v => ({
        color: v.color.trim(),
        size: v.size?.trim() || undefined,
        ram: requiresRAM ? (v.ram?.trim() || undefined) : (v.ram?.trim() || undefined),
        stock: parseInt(v.stock) || 0
      }));

    if (validVariations.length === 0) {
      Alert.alert("Lỗi", "Vui lòng thêm ít nhất 1 biến thể màu sắc");
      return;
    }

    try {
      setLoading(true);
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        in_stock: parseInt(formData.in_stock),
        variations: validVariations,
      };
      if (updateMode) {
        // UPDATE
        await API.put(`/products/${product._id}`, productData);
        Alert.alert("Cập nhật thành công", "Sản phẩm đã được sửa!", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      } else {
        // ADD
        const res = await API.post("/products", productData);
        if (res.data.success) {
          Alert.alert("Thành công", "Sản phẩm đã được thêm!", [
            { text: "OK", onPress: () => navigation.goBack() }
          ]);
        }
      }
    } catch (err) {
      Alert.alert("Lỗi", err.response?.data?.message || "Có lỗi trong quá trình xử lý.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert("Xoá sản phẩm?", "Bạn có chắc chắn muốn xoá?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa", style: "destructive", onPress: async () => {
          try {
            setLoading(true);
            await API.delete(`/products/${product._id}`);
            Alert.alert("Đã xoá sản phẩm", "Sản phẩm đã bị xóa khỏi hệ thống.", [
              { text: "OK", onPress: () => navigation.goBack() }
            ]);
          } catch (err) {
            Alert.alert("Lỗi xoá", err.response?.data?.message || "Không xóa được.");
          } finally{ setLoading(false); }
        }
      }
    ]);
  };

  // Tìm tên category theo id
  const getCatName = (id) => categories.find(cat => cat._id === id)?.name || "Chọn danh mục";

  if (userRole !== "admin") {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Bạn không có quyền truy cập trang này</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>
              {updateMode ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Thông tin cơ bản */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên sản phẩm *</Text>
              <TextInput 
                style={styles.input} 
                value={formData.name} 
                onChangeText={v => handleInputChange('name', v)} 
                placeholder="Nhập tên sản phẩm" 
                placeholderTextColor="#6b7280"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mô tả *</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                value={formData.description} 
                onChangeText={v => handleInputChange('description', v)} 
                placeholder="Nhập mô tả chi tiết về sản phẩm" 
                placeholderTextColor="#6b7280"
                multiline 
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Danh mục *</Text>
              <TouchableOpacity 
                style={styles.catDropdown} 
                onPress={() => setCatModal(true)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.catDropdownText,
                  !formData.category_id && styles.catDropdownTextPlaceholder
                ]}>
                  {getCatName(formData.category_id)}
                </Text>
                <Text style={styles.catDropdownArrow}>▼</Text>
              </TouchableOpacity>
              <Modal
                transparent
                visible={catModal}
                animationType="fade"
                onRequestClose={() => setCatModal(false)}
              >
                <TouchableOpacity 
                  style={styles.modalOverlay} 
                  activeOpacity={1}
                  onPress={() => setCatModal(false)}
                />
                <View style={styles.modalWrap}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Chọn danh mục</Text>
                    <TouchableOpacity 
                      onPress={() => setCatModal(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalClose}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={categories}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={styles.catItem} 
                        onPress={() => { 
                          setFormData(prev=>({...prev, category_id:item._id })); 
                          setCatModal(false); 
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.catName}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                    keyExtractor={item => item._id}
                  />
                </View>
              </Modal>
            </View>
          </View>

          {/* Giá và tồn kho */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Giá và tồn kho</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Giá (VNĐ) *</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.price} 
                  onChangeText={v => handleInputChange('price', v)} 
                  placeholder="0" 
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, styles.halfWidth, { marginLeft: 12 }]}>
                <Text style={styles.label}>Số lượng tồn kho *</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.in_stock} 
                  onChangeText={v => handleInputChange('in_stock', v)} 
                  placeholder="0" 
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mã SKU *</Text>
              <TextInput 
                style={styles.input} 
                value={formData.sku} 
                onChangeText={v => handleInputChange('sku', v)} 
                placeholder="Nhập mã SKU duy nhất" 
                placeholderTextColor="#6b7280"
              />
            </View>
          </View>

          {/* Hình ảnh */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hình ảnh</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>URL hình ảnh</Text>
              <TextInput 
                style={styles.input} 
                value={formData.imageUrl} 
                onChangeText={v => handleInputChange('imageUrl', v)} 
                placeholder="Nhập URL hình ảnh (tùy chọn)" 
                placeholderTextColor="#6b7280"
              />
              {formData.imageUrl ? (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: imageUrl(formData.imageUrl) }} 
                    style={styles.previewImage} 
                    resizeMode="cover" 
                  />
                </View>
              ) : null}
            </View>
          </View>

          {/* Biến thể màu sắc */}
          <View style={styles.section}>
            <View style={styles.variationsHeader}>
              <Text style={styles.sectionTitle}>Biến thể sản phẩm *</Text>
              <TouchableOpacity 
                style={styles.addVariationButton}
                onPress={addVariation}
                activeOpacity={0.7}
              >
                <Text style={styles.addVariationText}>+ Thêm</Text>
              </TouchableOpacity>
            </View>
            
            {variations.map((variation, index) => (
              <View key={index} style={styles.variationItem}>
                <View style={styles.variationRow}>
                  <View style={styles.variationInputWrapper}>
                    <Text style={styles.variationLabel}>Màu sắc *</Text>
                    <TextInput
                      style={[styles.input, styles.variationInput]}
                      value={variation.color}
                      onChangeText={(value) => updateVariation(index, 'color', value)}
                      placeholder="VD: Đỏ, Xanh, Đen..."
                      placeholderTextColor="#6b7280"
                    />
                  </View>
                  <View style={[styles.variationInputWrapper, { marginLeft: 12 }]}>
                    <Text style={styles.variationLabel}>Dung lượng</Text>
                    <TextInput
                      style={[styles.input, styles.variationInput]}
                      value={variation.size}
                      onChangeText={(value) => updateVariation(index, 'size', value)}
                      placeholder="VD: 256GB, 512GB..."
                      placeholderTextColor="#6b7280"
                    />
                  </View>
                </View>
                <View style={[styles.variationRow, { marginTop: 12 }]}>
                  {requiresRAM && (
                    <View style={styles.variationInputWrapper}>
                      <Text style={styles.variationLabel}>RAM *</Text>
                      <TextInput
                        style={[styles.input, styles.variationInput]}
                        value={variation.ram}
                        onChangeText={(value) => updateVariation(index, 'ram', value)}
                        placeholder="VD: 8GB, 16GB..."
                        placeholderTextColor="#6b7280"
                      />
                    </View>
                  )}
                  <View style={[styles.variationInputWrapper, requiresRAM ? { marginLeft: 12 } : {}]}>
                    <Text style={styles.variationLabel}>Số lượng *</Text>
                    <TextInput
                      style={[styles.input, styles.variationInput]}
                      value={variation.stock}
                      onChangeText={(value) => updateVariation(index, 'stock', value.replace(/[^0-9]/g, ''))}
                      placeholder="0"
                      placeholderTextColor="#6b7280"
                      keyboardType="numeric"
                    />
                  </View>
                  {variations.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeVariationButton}
                      onPress={() => removeVariation(index)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.removeVariationText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
            <Text style={styles.variationHint}>
              * Mỗi biến thể cần có màu sắc và số lượng. {requiresRAM ? "RAM là bắt buộc cho sản phẩm này." : "Dung lượng và RAM là tùy chọn."} Tổng số lượng sẽ được tính tự động.
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
              onPress={handleSubmit} 
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>
                {loading 
                  ? (updateMode ? "Đang lưu..." : "Đang thêm...") 
                  : (updateMode ? "Lưu thay đổi" : "Thêm sản phẩm")
                }
              </Text>
            </TouchableOpacity>
            
            {updateMode && (
              <TouchableOpacity 
                style={[styles.delBtn, loading && styles.submitButtonDisabled]} 
                onPress={handleDelete} 
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.delBtnText}>🗑 Xoá sản phẩm</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0a0a0a' 
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    backgroundColor: '#0a0a0a',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 24,
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '400',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  row: {
    flexDirection: 'row',
  },
  halfWidth: {
    flex: 1,
  },
  catDropdown: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catDropdownText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '400',
  },
  catDropdownTextPlaceholder: {
    color: '#6b7280',
  },
  catDropdownArrow: {
    color: '#9ca3af',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalWrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '30%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalClose: {
    color: '#9ca3af',
    fontSize: 24,
    fontWeight: '300',
  },
  catItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  catName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  variationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addVariationButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addVariationText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  variationItem: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  variationRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  variationInputWrapper: {
    flex: 1,
  },
  variationLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  variationInput: {
    marginBottom: 0,
  },
  removeVariationButton: {
    width: 40,
    height: 40,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginBottom: 0,
  },
  removeVariationText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  variationHint: {
    color: '#9ca3af',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 18,
  },
  buttonsContainer: {
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  delBtn: {
    marginTop: 12,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  delBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
    fontWeight: '600',
  },
});
