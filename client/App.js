import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import SplashScreen from "./src/screens/SplashScreen";
import HomeScreen from "./src/screens/HomeScreen";
import CategoriesScreen from "./src/screens/CategoriesScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import AddProductScreen from "./src/screens/AddProductScreen";
import AdminProductsScreen from "./src/screens/AdminProductsScreen";
import CartScreen from "./src/screens/CartScreen";
import GuestCartScreen from "./src/screens/GuestCartScreen";
import CheckoutScreen from "./src/screens/CheckoutScreen";
import OrdersScreen from "./src/screens/OrdersScreen";
import OrderHistoryScreen from "./src/screens/OrderHistoryScreen";
import OrderDetailScreen from "./src/screens/OrderDetailScreen";
import AddressesScreen from "./src/screens/AddressesScreen";
import EditProfileAndAddressesScreen from "./src/screens/EditProfileAndAddressesScreen";
import VouchersScreen from "./src/screens/VouchersScreen";
import RevenueStatsScreen from "./src/screens/RevenueStatsScreen";
import PaymentMethodsScreen from "./src/screens/PaymentMethodsScreen";
import ProductDetailScreen from "./src/screens/ProductDetailScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Categories" component={CategoriesScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="AddProduct" component={AddProductScreen} />
        <Stack.Screen name="AdminProducts" component={AdminProductsScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="GuestCart" component={GuestCartScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Orders" component={OrdersScreen} />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        <Stack.Screen name="Addresses" component={AddressesScreen} />
        <Stack.Screen name="EditProfileAndAddresses" component={EditProfileAndAddressesScreen} />
        <Stack.Screen name="Vouchers" component={VouchersScreen} />
        <Stack.Screen name="RevenueStats" component={RevenueStatsScreen} />
        <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
