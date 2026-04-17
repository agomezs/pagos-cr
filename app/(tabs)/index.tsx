import { View, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import Dashboard from "../../components/Dashboard";

export default function DashboardScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View style={{ paddingTop: Platform.OS === "ios" ? 54 : 32 }} />
      <Dashboard />
    </View>
  );
}
