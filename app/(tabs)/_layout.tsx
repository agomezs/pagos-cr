import { Tabs } from "expo-router";
import { LayoutDashboard, Users, FileText } from "lucide-react-native";
import { useTheme } from "../../lib/theme";
import { LABELS } from "../../constants/labels";

export default function TabsLayout() {
  const { colorScheme } = useTheme();
  const dark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: dark ? "#111827" : "#ffffff", borderTopColor: dark ? "#1f2937" : "#e5e7eb" },
        tabBarActiveTintColor: dark ? "#60a5fa" : "#2563eb",
        tabBarInactiveTintColor: dark ? "#6b7280" : "#9ca3af",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: LABELS.dashboard.tab,
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: LABELS.contacts.tab,
          tabBarIcon: ({ color, size }) => (
            <Users color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: LABELS.templates.tab,
          tabBarIcon: ({ color, size }) => (
            <FileText color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="importexport" options={{ href: null }} />
    </Tabs>
  );
}
