import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { Client } from "../../lib/types";

export function ClientPickerModal({
  visible,
  clients,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  clients: Client[];
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
      <View className="flex-1 bg-gray-50">
        <View className="px-4 pt-6 pb-3 flex-row items-center justify-between border-b border-gray-100 bg-white">
          <Text className="text-lg font-bold text-gray-900">Filtrar por cliente</Text>
          <Pressable onPress={onClose} className="active:opacity-70">
            <Text className="text-blue-600 font-semibold text-base">Listo</Text>
          </Pressable>
        </View>
        <View className="px-4 py-3 bg-white border-b border-gray-100">
          <TextInput
            className="bg-gray-100 rounded-xl px-4 py-2.5 text-base text-gray-900"
            placeholder="Buscar cliente…"
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
        <ScrollView>
          <Pressable
            onPress={() => { onSelect(null); onClose(); }}
            className="px-4 py-4 bg-white border-b border-gray-100 active:opacity-70"
          >
            <Text className={`text-base ${selected === null ? "text-blue-600 font-semibold" : "text-gray-800"}`}>
              Todos los clientes
            </Text>
          </Pressable>
          {filtered.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => { onSelect(c.id); onClose(); }}
              className="px-4 py-4 bg-white border-b border-gray-100 active:opacity-70"
            >
              <Text className={`text-base ${selected === c.id ? "text-blue-600 font-semibold" : "text-gray-800"}`}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
