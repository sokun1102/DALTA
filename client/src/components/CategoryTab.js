import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export default function CategoryTab({ 
  category, 
  isActive, 
  onPress 
}) {
  return (
    <TouchableOpacity 
      style={[
        styles.categoryTab,
        isActive && styles.activeCategoryTab
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.categoryTabText,
        isActive && styles.activeCategoryTabText
      ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});
