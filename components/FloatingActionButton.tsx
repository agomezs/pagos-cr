import { Pressable, Text } from "react-native";

type FloatingActionButtonProps = {
  onPress: () => void;
  label?: string;
  className?: string;
};

const BASE_CLASSNAME =
  "absolute bottom-8 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg active:opacity-70";

export default function FloatingActionButton({
  onPress,
  label = "+",
  className,
}: FloatingActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={className ? `${BASE_CLASSNAME} ${className}` : BASE_CLASSNAME}
    >
      <Text className="text-white text-3xl font-light leading-none">{label}</Text>
    </Pressable>
  );
}
