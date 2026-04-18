import { Tabs } from "expo-router";
import { LABELS } from "../../constants/labels";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="clients" options={{ title: LABELS.clients.tab }} />
      <Tabs.Screen name="templates" options={{ title: LABELS.templates.tab }} />
    </Tabs>
  );
}
