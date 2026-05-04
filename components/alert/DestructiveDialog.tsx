import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { LABELS } from "../../constants/labels";

type Props = {
  trigger: string;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
};

export default function DestructiveDialog({ trigger, title, message, confirmLabel, onConfirm }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable onPress={() => setOpen(true)} className="py-4 items-center">
        <Text className="text-base font-medium text-red-500">{trigger}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center px-6"
          onPress={() => setOpen(false)}
        >
          <Pressable className="w-full bg-white dark:bg-gray-800 rounded-2xl p-6 gap-4" onPress={() => {}}>
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">{message}</Text>
            <View className="flex-row justify-end gap-3 mt-2">
              <Pressable onPress={() => setOpen(false)} className="px-4 py-2 rounded-lg active:opacity-70">
                <Text className="text-base text-gray-600 dark:text-gray-300">{LABELS.common.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={() => { setOpen(false); onConfirm(); }}
                className="px-4 py-2 rounded-lg bg-red-600 active:opacity-70"
              >
                <Text className="text-base font-semibold text-white">{confirmLabel}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
