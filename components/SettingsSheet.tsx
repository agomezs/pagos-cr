import { Pressable, Text, View } from 'react-native';
import { X, FileUp, ChevronRight, Moon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from './ui/actionsheet';
import { Switch } from './ui/switch';
import { useTheme } from '../lib/theme';
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

type SettingsToggleRowProps = {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onToggle: () => void;
};

function SettingsRow({ icon, label, onPress }: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-800"
    >
      <View className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900 items-center justify-center">
        {icon}
      </View>
      <Text className="flex-1 text-base text-gray-900 dark:text-gray-100">{label}</Text>
      <ChevronRight size={18} color="#d1d5db" />
    </Pressable>
  );
}

function SettingsToggleRow({ icon, label, value, onToggle }: SettingsToggleRowProps) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-700">
      <View className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900 items-center justify-center">
        {icon}
      </View>
      <Text className="flex-1 text-base text-gray-900 dark:text-gray-100">{label}</Text>
      <Switch value={value} onValueChange={onToggle} />
    </View>
  );
}

export default function SettingsSheet({ visible, onClose }: Props) {
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useTheme();

  return (
    <Actionsheet isOpen={visible} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent>

        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        {/* Header */}
        <View className="w-full flex-row items-center justify-between py-3">
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">{LABELS.settings.screenTitle}</Text>
          <Pressable onPress={onClose} hitSlop={12} className="active:opacity-60">
            <X size={20} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Rows */}
        <View className="w-full mb-6 gap-2">
          <SettingsRow
            icon={<FileUp size={16} color="#3b82f6" />}
            label={LABELS.importExport.screenTitle}
            onPress={() => { onClose(); router.push('/(tabs)/importexport'); }}
          />
          <SettingsToggleRow
            icon={<Moon size={16} color={colorScheme === 'dark' ? '#93c5fd' : '#3b82f6'} />}
            label={LABELS.settings.darkMode}
            value={colorScheme === 'dark'}
            onToggle={toggleColorScheme}
          />
        </View>

      </ActionsheetContent>
    </Actionsheet>
  );
}
