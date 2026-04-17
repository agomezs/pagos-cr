import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { formatColones } from "../lib/format";
import type { ChargeTemplate } from "../lib/types";

type Props = {
  visible: boolean;
  templates: ChargeTemplate[];
  onSelect: (tpl: ChargeTemplate) => void;
  onClose: () => void;
};

export default function TemplatePickerModal({ visible, templates, onSelect, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-gray-50">
        <View className="px-4 pt-6 pb-4 flex-row items-center justify-between border-b border-gray-200 bg-white">
          <Text className="text-lg font-bold text-gray-900">Elegir plantilla</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text className="text-blue-600 font-medium">Cancelar</Text>
          </Pressable>
        </View>

        {templates.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-gray-400 text-base text-center">
              No hay plantillas. Crea una desde la pestaña Plantillas.
            </Text>
          </View>
        ) : (
          <FlatList
            data={templates}
            keyExtractor={(t) => t.id}
            contentContainerClassName="p-4 gap-3"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                className="bg-white border border-gray-200 rounded-2xl px-4 py-3 active:opacity-70"
              >
                <Text className="text-base font-semibold text-gray-900">{item.concept}</Text>
                <Text className="text-sm text-gray-500">{formatColones(item.amount)}</Text>
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}
