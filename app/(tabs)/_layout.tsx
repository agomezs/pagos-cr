import { Tabs } from "expo-router";
import { LayoutDashboard, Users, FileText, ArrowLeftRight } from "lucide-react-native";
import { LABELS } from "../../constants/labels";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
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
      <Tabs.Screen
        name="importexport"
        options={{
          title: LABELS.importExport.tab,
          tabBarIcon: ({ color, size }) => (
            <ArrowLeftRight color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
