import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function SearchBar({
  searchText,
  onSearchChange,
  onSearchSubmit,
  cartCount,
  onCartPress,
}) {
  return (
    <View style={styles.searchContainer}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm sản phẩm, danh mục..."
        placeholderTextColor="#9ca3af"
        value={searchText}
        onChangeText={onSearchChange}
        returnKeyType="search"
        onSubmitEditing={onSearchSubmit}
      />
      <TouchableOpacity style={styles.cartInSearch} onPress={onCartPress}>
        <Text style={styles.cartInSearchIcon}>🛒</Text>
        {cartCount > 0 && (
          <View style={styles.cartInSearchBadge}>
            <Text style={styles.cartInSearchBadgeText}>{cartCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingLeft: 12,
    paddingRight: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: "#000",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  cartInSearch: {
    position: "relative",
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginLeft: 8,
    backgroundColor: "#000",
    borderRadius: 18,
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  cartInSearchIcon: {
    color: "#fff",
    fontSize: 16,
  },
  cartInSearchBadge: {
    position: "absolute",
    right: -2,
    top: -2,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  cartInSearchBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
