import { View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import Dashboard from "../../components/Dashboard";

export default function DashboardScreen() {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View className="px-4 pb-3">
        <Text className="text-xl font-bold text-gray-900">Cobros</Text>
      </View>
      <Dashboard />
    </SafeAreaView>
  );
}
