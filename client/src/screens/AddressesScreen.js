import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API, { setAuthToken } from "../services/api";

export default function AddressesScreen({ navigation }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    street: "",
    ward: "",
    district: "",
    city: "",
    zip: "",
    is_default: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Chưa đăng nhập", "Vui lòng đăng nhập để xem địa chỉ");
        navigation.goBack();
        return;
      }

      setAuthToken(token);
      const response = await API.get("/auth/users/me/addresses");

      if (response.data?.success) {
        setAddresses(response.data.data || []);
      } else {
        throw new Error(response.data?.message || "Không thể tải địa chỉ");
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách địa chỉ");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAddresses();
    setRefreshing(false);
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setFormData({
      name: "",
      phone: "",
      street: "",
      ward: "",
      district: "",
      city: "",
      zip: "",
      is_default: false,
    });
    setModalVisible(true);
  };

  const openEditModal = (address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name || "",
      phone: address.phone || "",
      street: address.street || "",
      ward: address.ward || "",
      district: address.district || "",
      city: address.city || "",
      zip: address.zip || "",
      is_default: address.is_default || false,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên người nhận");
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
      return;
    }
    if (!formData.street.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập địa chỉ chi tiết");
      return;
    }
    if (!formData.city.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tỉnh/thành phố");
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("token");
      setAuthToken(token);

      if (editingAddress) {
        // Update
        await API.put(`/auth/users/me/addresses/${editingAddress._id}`, formData);
        Alert.alert("Thành công", "Đã cập nhật địa chỉ");
      } else {
        // Add
        await API.post("/auth/users/me/addresses", formData);
        Alert.alert("Thành công", "Đã thêm địa chỉ mới");
      }

      setModalVisible(false);
      fetchAddresses();
    } catch (error) {
      console.error("Error saving address:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Không thể lưu địa chỉ";
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (addressId) => {
    Alert.alert(
      "Xóa địa chỉ",
      "Bạn có chắc chắn muốn xóa địa chỉ này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              setAuthToken(token);
              await API.delete(`/auth/users/me/addresses/${addressId}`);
              Alert.alert("Thành công", "Đã xóa địa chỉ");
              fetchAddresses();
            } catch (error) {
              console.error("Error deleting address:", error);
              Alert.alert("Lỗi", "Không thể xóa địa chỉ");
            }
          },
        },
      ]
    );
  };

  const renderAddressItem = ({ item }) => (
    <View style={styles.addressItem}>
      <View style={styles.addressHeader}>
        <View style={styles.addressTitleRow}>
          <Text style={styles.addressName}>{item.name}</Text>
          {item.is_default && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Mặc định</Text>
            </View>
          )}
        </View>
        <View style={styles.addressActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.editButtonText}>Sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item._id)}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteButtonText}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.addressPhone}>{item.phone}</Text>
      <Text style={styles.addressText}>
        {item.street}
        {item.ward ? `, ${item.ward}` : ""}
        {item.district ? `, ${item.district}` : ""}
        {item.city ? `, ${item.city}` : ""}
        {item.zip ? ` - ${item.zip}` : ""}
      </Text>
      {!item.is_default && (
        <TouchableOpacity
          style={styles.setDefaultButton}
          onPress={() => {
            setEditingAddress(item);
            setFormData({ ...item, is_default: true });
            handleSave();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.setDefaultButtonText}>Đặt làm mặc định</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Địa chỉ giao hàng</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={openAddModal}
          activeOpacity={0.7}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderAddressItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.addressesList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có địa chỉ nào</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
                <Text style={styles.emptyButtonText}>Thêm địa chỉ mới</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tên người nhận *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên người nhận"
                  placeholderTextColor="#6b7280"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số điện thoại *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor="#6b7280"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Địa chỉ chi tiết *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Số nhà, tên đường..."
                  placeholderTextColor="#6b7280"
                  value={formData.street}
                  onChangeText={(text) => setFormData({ ...formData, street: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phường/Xã</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập phường/xã"
                  placeholderTextColor="#6b7280"
                  value={formData.ward}
                  onChangeText={(text) => setFormData({ ...formData, ward: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quận/Huyện</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập quận/huyện"
                  placeholderTextColor="#6b7280"
                  value={formData.district}
                  onChangeText={(text) => setFormData({ ...formData, district: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tỉnh/Thành phố *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tỉnh/thành phố"
                  placeholderTextColor="#6b7280"
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mã bưu điện</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mã bưu điện"
                  placeholderTextColor="#6b7280"
                  value={formData.zip}
                  onChangeText={(text) => setFormData({ ...formData, zip: text })}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() =>
                  setFormData({ ...formData, is_default: !formData.is_default })
                }
              >
                <Text style={styles.checkboxText}>
                  {formData.is_default ? "☑" : "☐"} Đặt làm địa chỉ mặc định
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "300",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 12,
  },
  addressesList: {
    padding: 16,
  },
  addressItem: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  addressTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    flexWrap: "wrap",
  },
  addressName: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginRight: 10,
    letterSpacing: 0.2,
  },
  defaultBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  defaultBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  addressActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 6,
  },
  editButtonText: {
    color: "#10b981",
    fontSize: 13,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 6,
  },
  deleteButtonText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "600",
  },
  addressPhone: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 8,
    marginTop: 8,
    fontWeight: "500",
  },
  addressText: {
    color: "#d1d5db",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  setDefaultButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  setDefaultButtonText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 16,
    marginBottom: 20,
    fontWeight: "500",
  },
  emptyButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "300",
  },
  modalBody: {
    padding: 16,
    maxHeight: 500,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: "#d1d5db",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: "#0f0f0f",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
    fontWeight: "500",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
  },
  checkboxText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  saveButton: {
    backgroundColor: "#ef4444",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

