import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { deleteTemplate, listTemplates } from "../../db/chargeTemplates";
import { formatColones } from "../../lib/format";
import type { ChargeTemplate } from "../../lib/types";
import { LABELS } from "../../constants/labels";

export default function TemplatesScreen() {
  const router = useRouter();
  const [templates, setTemplates] = useState<ChargeTemplate[]>([]);

  useFocusEffect(
    useCallback(() => {
      setTemplates(listTemplates());
    }, []),
  );

  function confirmDelete(id: string, concept: string) {
    Alert.alert(
      LABELS.templates.deleteAlertTitle,
      LABELS.templates.deleteAlertMessage(concept),
      [
        { text: LABELS.common.cancel, style: "cancel" },
        {
          text: LABELS.common.delete,
          style: "destructive",
          onPress: () => {
            deleteTemplate(id);
            setTemplates(listTemplates());
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      <View className="px-4 pb-3">
        <Text className="text-xl font-bold text-gray-900">{LABELS.templates.screenTitle}</Text>
      </View>

      <FlatList
        className="flex-1"
        data={templates}
        keyExtractor={(t) => t.id}
        contentContainerClassName="pt-2 pb-24"
        ListEmptyComponent={
          <View className="items-center py-16 gap-2">
            <Text className="text-4xl">📋</Text>
            <Text className="text-base font-medium text-gray-500">{LABELS.templates.emptyTitle}</Text>
            <Text className="text-sm text-gray-400">{LABELS.templates.emptyHint}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/templates/${item.id}/edit`)}
            className="mx-4 mb-3 bg-white border border-gray-100 rounded-2xl shadow-sm flex-row items-stretch overflow-hidden active:opacity-70"
          >
            <View className="flex-1 px-4 py-3 gap-0.5">
              <Text className="text-base font-semibold text-gray-900">{item.concept}</Text>
              <Text className="text-sm text-gray-500">{formatColones(item.amount)}</Text>
              <Text className="text-xs text-gray-400">{item.type === "recurring" ? LABELS.templates.typeRecurring : LABELS.templates.typeExtra}</Text>
            </View>
            <View className="justify-center px-2">
              <Text className="text-gray-300 text-lg">›</Text>
            </View>
            <Pressable
              onPress={() => confirmDelete(item.id, item.concept)}
              className="bg-red-50 px-4 items-center justify-center active:bg-red-100"
            >
              <Text className="text-red-500 text-sm font-medium">{LABELS.common.delete}</Text>
            </Pressable>
          </Pressable>
        )}
      />

      <Pressable
        onPress={() => router.push("/templates/new")}
        className="absolute bottom-8 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Text className="text-white text-3xl font-light leading-none">+</Text>
      </Pressable>
    </SafeAreaView>
  );
}
