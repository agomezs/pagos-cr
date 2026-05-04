import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { Contact } from "../../lib/types";
import { LABELS } from "../../constants/labels";

export function ClientPickerModal({
  visible,
  clients,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  clients: Contact[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        <View className="px-4 pt-6 pb-3 flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">{LABELS.dashboard.filterModalTitle}</Text>
          <Pressable onPress={onClose} className="active:opacity-70">
            <Text className="text-blue-600 font-semibold text-base">{LABELS.common.done}</Text>
          </Pressable>
        </View>
        <View className="px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <TextInput
            className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-base text-gray-900 dark:text-gray-100"
            placeholder={LABELS.dashboard.searchContact}
            placeholderTextColor="#6b7280"
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
        <ScrollView>
          <Pressable
            onPress={() => { onSelect(null); onClose(); }}
            className="px-4 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 active:opacity-70"
          >
            <Text className={`text-base ${selected === null ? "text-blue-600 font-semibold" : "text-gray-800 dark:text-gray-200"}`}>
              {LABELS.dashboard.allContacts}
            </Text>
          </Pressable>
          {filtered.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => { onSelect(c.id); onClose(); }}
              className="px-4 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 active:opacity-70"
            >
              <Text className={`text-base ${selected === c.id ? "text-blue-600 font-semibold" : "text-gray-800 dark:text-gray-200"}`}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
