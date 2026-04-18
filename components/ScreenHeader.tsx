import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export default function ScreenHeader({ title, onBack, right }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-row items-center justify-between pb-2"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="flex-row items-center gap-3 flex-1">
        {onBack && (
          <Pressable onPress={onBack} hitSlop={12}>
            <Text className="text-blue-600 text-base font-medium">← Volver</Text>
          </Pressable>
        )}
        <Text className="text-xl font-bold text-gray-900">{title}</Text>
      </View>
      {right}
    </View>
  );
}
