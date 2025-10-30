import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Image, Modal, FlatList, Platform, SafeAreaView
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

  const handleSubmit = async () => {
    // Validation (giữ nguyên)
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

    try {
      setLoading(true);
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        in_stock: parseInt(formData.in_stock),
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
      <View style={styles.container}><Text style={styles.errorText}>Bạn không có quyền truy cập trang này</Text></View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{updateMode ? "Chỉnh sửa" : "Thêm"} sản phẩm</Text>
      </View>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên sản phẩm *</Text>
          <TextInput style={styles.input} value={formData.name} onChangeText={v => handleInputChange('name', v)} placeholder="Nhập tên sản phẩm" placeholderTextColor="#9ca3af" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mô tả *</Text>
          <TextInput style={[styles.input, styles.textArea]} value={formData.description} onChangeText={v => handleInputChange('description', v)} placeholder="Nhập mô tả sản phẩm" placeholderTextColor="#9ca3af" multiline numberOfLines={3} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Giá (VNĐ) *</Text>
          <TextInput style={styles.input} value={formData.price} onChangeText={v => handleInputChange('price', v)} placeholder="Nhập giá sản phẩm" placeholderTextColor="#9ca3af" keyboardType="numeric" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>SKU *</Text>
          <TextInput style={styles.input} value={formData.sku} onChangeText={v => handleInputChange('sku', v)} placeholder="Nhập mã SKU" placeholderTextColor="#9ca3af" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số lượng tồn kho *</Text>
          <TextInput style={styles.input} value={formData.in_stock} onChangeText={v => handleInputChange('in_stock', v)} placeholder="Nhập số lượng tồn kho" placeholderTextColor="#9ca3af" keyboardType="numeric" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Danh mục *</Text>
          <TouchableOpacity style={styles.catDropdown} onPress={() => setCatModal(true)}>
            <Text style={{color: formData.category_id ? '#fff' : '#9ca3af'}}>{getCatName(formData.category_id)}</Text>
          </TouchableOpacity>
          <Modal
            transparent
            visible={catModal}
            animationType="fade"
            onRequestClose={() => setCatModal(false)}
          >
            <TouchableOpacity style={styles.modalOverlay} onPress={() => setCatModal(false)} />
            <View style={styles.modalWrap}>
              <FlatList
                data={categories}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.catItem} onPress={() => { setFormData(prev=>({...prev, category_id:item._id })); setCatModal(false); }}>
                    <Text style={styles.catName}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={item => item._id}
              />
            </View>
          </Modal>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>URL hình ảnh</Text>
          <TextInput style={styles.input} value={formData.imageUrl} onChangeText={v => handleInputChange('imageUrl', v)} placeholder="Nhập URL hình ảnh (tùy chọn)" placeholderTextColor="#9ca3af" />
          {formData.imageUrl ? (
            <Image source={{ uri: imageUrl(formData.imageUrl) }} style={styles.previewImage} resizeMode="cover" />
          ) : null}
        </View>
        <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.submitButtonText}>{loading ? (updateMode ? "Đang lưu..." : "Đang thêm...") : (updateMode ? "Lưu thay đổi" : "Thêm sản phẩm")}</Text>
        </TouchableOpacity>
        {/* Nút xoá nếu đang ở chế độ sửa */}
        {updateMode && (
          <TouchableOpacity style={[styles.delBtn, loading && styles.submitButtonDisabled]} onPress={handleDelete} disabled={loading}>
            <Text style={{color:'#fff', fontSize:16, fontWeight:'600'}}>🗑 Xoá sản phẩm</Text>
          </TouchableOpacity>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#000' },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#333', },
  backButton: { marginRight: 16, },
  backButtonText: { color: '#ef4444', fontSize: 16, fontWeight: "600", },
  title: { color: '#fff', fontSize: 18, fontWeight: "bold", },
  form: { padding: 16, },
  inputGroup: { marginBottom: 20, },
  label: { color: '#fff', fontSize: 14, fontWeight: "600", marginBottom: 8, },
  input: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', borderRadius: 8, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 14 : 10, color: '#fff', fontSize: 14, },
  textArea: { height: 80, textAlignVertical: "top", },
  previewImage: { width: 100, height: 100, borderRadius: 8, marginTop: 8, },
  submitButton: { backgroundColor: '#ef4444', paddingVertical: 16, borderRadius: 8, alignItems: "center", marginTop: 20, },
  submitButtonDisabled: { backgroundColor: '#666', },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', },
  errorText: { color: '#ef4444', fontSize: 16, textAlign: 'center', marginTop: 50, },
  catDropdown: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 14, marginTop: 5 },
  modalOverlay: { position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.3)' },
  modalWrap:{ position:'absolute', left: 30, right: 30, top: '38%', backgroundColor:'#232323', borderRadius:10, padding:10, shadowColor:'#000', shadowOpacity:0.2, shadowRadius:10 },
  catItem:{ padding:14, borderBottomWidth:1, borderBottomColor:'#444' },
  catName:{ color:'#fff', fontSize:15 },
  delBtn:{ marginTop:20, backgroundColor:'#ef4444', alignItems:'center', borderRadius:8, paddingVertical:14 }
});
