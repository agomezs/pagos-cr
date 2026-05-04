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
import FloatingActionButton from "../../components/FloatingActionButton";
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
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="px-4 pb-3">
        <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">{LABELS.templates.screenTitle}</Text>
      </View>

      <FlatList
        className="flex-1"
        data={templates}
        keyExtractor={(t) => t.id}
        contentContainerClassName="pt-2 pb-24"
        ListEmptyComponent={
          <View className="items-center py-16 gap-2">
            <Text className="text-4xl">📋</Text>
            <Text className="text-base font-medium text-gray-500 dark:text-gray-400">{LABELS.templates.emptyTitle}</Text>
            <Text className="text-sm text-gray-400 dark:text-gray-500">{LABELS.templates.emptyHint}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/templates/${item.id}/edit`)}
            className="mx-4 mb-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm flex-row items-stretch overflow-hidden active:opacity-70"
          >
            <View className="flex-1 px-4 py-3 gap-0.5">
              <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">{item.concept}</Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">{formatColones(item.amount)}</Text>
              <Text className="text-xs text-gray-400 dark:text-gray-500">{item.type === "recurring" ? LABELS.templates.typeRecurring : LABELS.templates.typeExtra}</Text>
            </View>
            <View className="justify-center px-2">
              <Text className="text-gray-300 text-lg">›</Text>
            </View>
            <Pressable
              onPress={() => confirmDelete(item.id, item.concept)}
              className="bg-red-50 dark:bg-red-900/20 px-4 items-center justify-center active:bg-red-100 dark:active:bg-red-900/40"
            >
              <Text className="text-red-500 dark:text-red-400 text-sm font-medium">{LABELS.common.delete}</Text>
            </Pressable>
          </Pressable>
        )}
      />

      <FloatingActionButton onPress={() => router.push("/templates/new")} />
    </SafeAreaView>
  );
}
