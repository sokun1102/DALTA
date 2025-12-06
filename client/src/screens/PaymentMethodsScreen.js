import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API, { setAuthToken } from "../services/api";
import { useFocusEffect } from "@react-navigation/native";

export default function PaymentMethodsScreen({ navigation }) {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);
  const [formData, setFormData] = useState({
    type: "credit_card",
    provider: "",
    card_number: "",
    card_holder_name: "",
    expiry_date: "",
    bank_name: "",
    account_number: "",
    account_holder_name: "",
    wallet_id: "",
    is_default: false,
  });
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchPaymentMethods();
    }, [])
  );

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Chưa đăng nhập", "Vui lòng đăng nhập để xem phương thức thanh toán");
        navigation.goBack();
        return;
      }

      setAuthToken(token);
      const response = await API.get("/payment-methods");

      if (response.data?.success) {
        setPaymentMethods(response.data.data || []);
      } else {
        throw new Error(response.data?.message || "Không thể tải phương thức thanh toán");
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách phương thức thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPaymentMethods();
    setRefreshing(false);
  };

  const openAddModal = () => {
    setEditingPaymentMethod(null);
    setFormData({
      type: "credit_card",
      provider: "",
      card_number: "",
      card_holder_name: "",
      expiry_date: "",
      bank_name: "",
      account_number: "",
      account_holder_name: "",
      wallet_id: "",
      is_default: false,
    });
    setModalVisible(true);
  };

  const openEditModal = (paymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    setFormData({
      type: paymentMethod.type || "credit_card",
      provider: paymentMethod.provider || "",
      card_number: paymentMethod.card_number || "",
      card_holder_name: paymentMethod.card_holder_name || "",
      expiry_date: paymentMethod.expiry_date || "",
      bank_name: paymentMethod.bank_name || "",
      account_number: paymentMethod.account_number || "",
      account_holder_name: paymentMethod.account_holder_name || "",
      wallet_id: paymentMethod.wallet_id || "",
      is_default: paymentMethod.is_default || false,
    });
    setModalVisible(true);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      if (!formData.provider) {
        Alert.alert("Lỗi", "Vui lòng nhập tên nhà cung cấp");
        return;
      }

      setSaving(true);
      const token = await AsyncStorage.getItem("token");
      setAuthToken(token);

      if (editingPaymentMethod) {
        // Update
        const response = await API.put(
          `/payment-methods/${editingPaymentMethod._id}`,
          formData
        );
        if (response.data?.success) {
          Alert.alert("Thành công", "Đã cập nhật phương thức thanh toán");
          setModalVisible(false);
          fetchPaymentMethods();
        } else {
          throw new Error(response.data?.message || "Không thể cập nhật");
        }
      } else {
        // Create
        const response = await API.post("/payment-methods", formData);
        if (response.data?.success) {
          Alert.alert("Thành công", "Đã thêm phương thức thanh toán");
          setModalVisible(false);
          fetchPaymentMethods();
        } else {
          throw new Error(response.data?.message || "Không thể thêm");
        }
      }
    } catch (error) {
      console.error("Error saving payment method:", error);
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể lưu phương thức thanh toán");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (paymentMethod) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn xóa phương thức thanh toán này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              setAuthToken(token);
              const response = await API.delete(`/payment-methods/${paymentMethod._id}`);
              if (response.data?.success) {
                Alert.alert("Thành công", "Đã xóa phương thức thanh toán");
                fetchPaymentMethods();
              } else {
                throw new Error(response.data?.message || "Không thể xóa");
              }
            } catch (error) {
              console.error("Error deleting payment method:", error);
              Alert.alert("Lỗi", "Không thể xóa phương thức thanh toán");
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (paymentMethod) => {
    try {
      const token = await AsyncStorage.getItem("token");
      setAuthToken(token);
      const response = await API.put(`/payment-methods/${paymentMethod._id}/default`);
      if (response.data?.success) {
        Alert.alert("Thành công", "Đã đặt làm phương thức mặc định");
        fetchPaymentMethods();
      } else {
        throw new Error(response.data?.message || "Không thể đặt mặc định");
      }
    } catch (error) {
      console.error("Error setting default:", error);
      Alert.alert("Lỗi", "Không thể đặt phương thức mặc định");
    }
  };

  const getTypeLabel = (type) => {
    const typeMap = {
      credit_card: "Thẻ tín dụng",
      debit_card: "Thẻ ghi nợ",
      bank_account: "Tài khoản ngân hàng",
      e_wallet: "Ví điện tử",
      cod: "Thanh toán khi nhận hàng",
    };
    return typeMap[type] || type;
  };

  const getTypeIcon = (type) => {
    const iconMap = {
      credit_card: "💳",
      debit_card: "💳",
      bank_account: "🏦",
      e_wallet: "📱",
      cod: "💰",
    };
    return iconMap[type] || "💳";
  };

  const renderPaymentMethod = ({ item }) => (
    <View style={styles.paymentMethodCard}>
      <View style={styles.paymentMethodHeader}>
        <View style={styles.paymentMethodInfo}>
          <Text style={styles.paymentMethodIcon}>{getTypeIcon(item.type)}</Text>
          <View style={styles.paymentMethodDetails}>
            <View style={styles.paymentMethodTitleRow}>
              <Text style={styles.paymentMethodType}>{getTypeLabel(item.type)}</Text>
              {item.is_default && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Mặc định</Text>
                </View>
              )}
            </View>
            <Text style={styles.paymentMethodProvider}>{item.provider}</Text>
            {item.card_number && (
              <Text style={styles.paymentMethodNumber}>{item.card_number}</Text>
            )}
            {item.account_number && (
              <Text style={styles.paymentMethodNumber}>{item.account_number}</Text>
            )}
            {item.wallet_id && (
              <Text style={styles.paymentMethodNumber}>ID: {item.wallet_id}</Text>
            )}
            {item.card_holder_name && (
              <Text style={styles.paymentMethodHolder}>{item.card_holder_name}</Text>
            )}
            {item.account_holder_name && (
              <Text style={styles.paymentMethodHolder}>{item.account_holder_name}</Text>
            )}
            {item.expiry_date && (
              <Text style={styles.paymentMethodExpiry}>Hết hạn: {item.expiry_date}</Text>
            )}
            {item.bank_name && (
              <Text style={styles.paymentMethodBank}>{item.bank_name}</Text>
            )}
          </View>
        </View>
      </View>
      <View style={styles.paymentMethodActions}>
        {!item.is_default && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetDefault(item)}
          >
            <Text style={styles.actionButtonText}>Đặt mặc định</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
        >
          <Text style={[styles.actionButtonText, styles.editButtonText]}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && paymentMethods.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          <Text style={styles.headerTitle}>Phương Thức Thanh Toán</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
          activeOpacity={0.7}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {paymentMethods.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💳</Text>
          <Text style={styles.emptyTitle}>Chưa có phương thức thanh toán</Text>
          <Text style={styles.emptySubtitle}>
            Thêm phương thức thanh toán để thanh toán nhanh hơn
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
            <Text style={styles.emptyButtonText}>Thêm phương thức thanh toán</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={paymentMethods}
          renderItem={renderPaymentMethod}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
                {editingPaymentMethod ? "Sửa phương thức thanh toán" : "Thêm phương thức thanh toán"}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Type */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Loại *</Text>
                <View style={styles.typeButtons}>
                  {["credit_card", "debit_card", "bank_account", "e_wallet"].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        formData.type === type && styles.typeButtonActive,
                      ]}
                      onPress={() => handleInputChange("type", type)}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          formData.type === type && styles.typeButtonTextActive,
                        ]}
                      >
                        {getTypeLabel(type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Provider */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nhà cung cấp *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.provider}
                  onChangeText={(value) => handleInputChange("provider", value)}
                  placeholder="Ví dụ: Visa, Mastercard, Vietcombank..."
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Card fields */}
              {(formData.type === "credit_card" || formData.type === "debit_card") && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Số thẻ</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.card_number}
                      onChangeText={(value) => handleInputChange("card_number", value)}
                      placeholder="1234 5678 9012 3456"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Tên chủ thẻ</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.card_holder_name}
                      onChangeText={(value) => handleInputChange("card_holder_name", value)}
                      placeholder="NGUYEN VAN A"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Ngày hết hạn</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.expiry_date}
                      onChangeText={(value) => handleInputChange("expiry_date", value)}
                      placeholder="MM/YY"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </>
              )}

              {/* Bank account fields */}
              {formData.type === "bank_account" && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Tên ngân hàng</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.bank_name}
                      onChangeText={(value) => handleInputChange("bank_name", value)}
                      placeholder="Ví dụ: Vietcombank"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Số tài khoản</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.account_number}
                      onChangeText={(value) => handleInputChange("account_number", value)}
                      placeholder="1234567890"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Tên chủ tài khoản</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.account_holder_name}
                      onChangeText={(value) => handleInputChange("account_holder_name", value)}
                      placeholder="NGUYEN VAN A"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </>
              )}

              {/* E-wallet fields */}
              {formData.type === "e_wallet" && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>ID Ví điện tử</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.wallet_id}
                    onChangeText={(value) => handleInputChange("wallet_id", value)}
                    placeholder="Số điện thoại hoặc ID ví"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                </View>
              )}

              {/* Default */}
              <View style={styles.formGroup}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => handleInputChange("is_default", !formData.is_default)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      formData.is_default && styles.checkboxChecked,
                    ]}
                  >
                    {formData.is_default && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Đặt làm phương thức mặc định</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  headerTitle: {
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
  },
  addButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
  },
  paymentMethodCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  paymentMethodHeader: {
    marginBottom: 16,
  },
  paymentMethodInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  paymentMethodIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    flexWrap: "wrap",
  },
  paymentMethodType: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  paymentMethodProvider: {
    color: "#d1d5db",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  paymentMethodNumber: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 2,
  },
  paymentMethodHolder: {
    color: "#9ca3af",
    fontSize: 13,
    marginBottom: 2,
  },
  paymentMethodExpiry: {
    color: "#9ca3af",
    fontSize: 13,
    marginBottom: 2,
  },
  paymentMethodBank: {
    color: "#9ca3af",
    fontSize: 13,
  },
  paymentMethodActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  deleteButton: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  editButtonText: {
    color: "#d1d5db",
  },
  deleteButtonText: {
    color: "#ef4444",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#d1d5db",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  typeButtonActive: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  typeButtonText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
  },
  typeButtonTextActive: {
    color: "#fff",
  },
  input: {
    backgroundColor: "#0f0f0f",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#2a2a2a",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  checkboxCheck: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  checkboxLabel: {
    color: "#d1d5db",
    fontSize: 15,
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});

