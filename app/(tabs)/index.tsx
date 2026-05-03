import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Settings } from "lucide-react-native";
import Dashboard from "../../components/Dashboard";
import SettingsSheet from "../../components/SettingsSheet";

export default function DashboardScreen() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-3">
        <Text className="text-xl font-bold text-gray-900">Cobros</Text>
        <Pressable
          onPress={() => setSettingsOpen(true)}
          hitSlop={12}
          className="active:opacity-60"
        >
          <Settings size={22} color="#6b7280" />
        </Pressable>
      </View>

      <Dashboard />

      {settingsOpen && (
        <SettingsSheet
          visible={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}
