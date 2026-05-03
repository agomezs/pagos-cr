import { Pressable, Text, View } from 'react-native';
import { X, FileUp, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from './ui/actionsheet';
import { LABELS } from '../constants/labels';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type SettingsRowProps = {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
};

function SettingsRow({ icon, label, onPress }: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3 rounded-2xl border border-gray-100 active:bg-gray-50"
    >
      <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center">
        {icon}
      </View>
      <Text className="flex-1 text-base text-gray-900">{label}</Text>
      <ChevronRight size={18} color="#d1d5db" />
    </Pressable>
  );
}

export default function SettingsSheet({ visible, onClose }: Props) {
  const router = useRouter();

  return (
    <Actionsheet isOpen={visible} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent>

        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        {/* Header */}
        <View className="w-full flex-row items-center justify-between py-3">
          <Text className="text-lg font-bold text-gray-900">{LABELS.settings.screenTitle}</Text>
          <Pressable onPress={onClose} hitSlop={12} className="active:opacity-60">
            <X size={20} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Rows */}
        <View className="w-full mb-6">
          <SettingsRow
            icon={<FileUp size={16} color="#3b82f6" />}
            label={LABELS.importExport.screenTitle}
            onPress={() => { onClose(); router.push('/(tabs)/importexport'); }}
          />
        </View>

      </ActionsheetContent>
    </Actionsheet>
  );
}
