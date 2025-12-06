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
      activeOpacity={0.7}
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
});
