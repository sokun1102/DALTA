import React, { useState, useEffect } from "react";
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, Dimensions 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API from "../services/api";

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
      <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
      <Text style={styles.price}>{item.price?.toLocaleString() || 0} đ</Text>
      <Text style={styles.sku}>SKU: {item.sku}</Text>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item)}>
          <Text style={styles.editTxt}>✏️ Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.delBtn} onPress={() => onDelete(item)}>
          <Text style={styles.delTxt}>🗑 Xoá</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý sản phẩm</Text>
        <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
          <Text style={styles.addTxt}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader}/>
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
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#16161a" },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center",
    padding: 16, backgroundColor: "#1a1a1a",
    borderBottomWidth: 1, borderBottomColor: "#333"
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  addBtn: {
    backgroundColor: "#ef4444", paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 8
  },
  addTxt: { color: "#fff", fontWeight: "bold" },
  card: {
    backgroundColor: "#232323", borderRadius: 10,
    padding: 14, marginBottom: 14,
  },
  name: { color: "#fff", fontWeight: "bold" },
  desc: { color: "#ccc", fontSize: 12, marginVertical: 2 },
  price: { color: "#ef4444", fontWeight: "bold" },
  sku: { color: "#59f", fontSize: 11, marginTop: 4 },
  btnRow: { flexDirection: "row", marginTop: 10 },
  editBtn: {
    backgroundColor: "#4ade80", paddingVertical: 7,
    paddingHorizontal: 16, borderRadius: 6, marginRight: 8
  },
  editTxt: { color: "#000", fontWeight: "bold" },
  delBtn: {
    backgroundColor: "#ef4444", paddingVertical: 7,
    paddingHorizontal: 16, borderRadius: 6
  },
  delTxt: { color: "#fff", fontWeight: "bold" },
  loader: { marginTop: 40 },
  listContent: { padding: 12, paddingBottom: 40 }
});
