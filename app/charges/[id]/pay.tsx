import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScreenHeader from "../../../components/ScreenHeader";
import { markLinePaid } from "../../../db/chargeLines";
import { refreshChargeStatus } from "../../../db/charges";
import { formatColones, formatDate } from "../../../lib/format";
import type { PaymentMethod } from "../../../lib/types";
import { LABELS } from "../../../constants/labels";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "sinpe", label: LABELS.paymentMethod.sinpe },
  { value: "transfer", label: LABELS.paymentMethod.transfer },
  { value: "cash", label: LABELS.paymentMethod.cash },
];

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function PayLineScreen() {
  const { id, concept, amount, contact_name, charge_id } = useLocalSearchParams<{
    id: string;
    concept: string;
    amount: string;
    contact_name: string;
    charge_id: string;
  }>();
  const router = useRouter();

  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [note, setNote] = useState("");
  const [paidAt, setPaidAt] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    if (!method) {
      setError(LABELS.pay.errorMethodRequired);
      return;
    }
    setError(null);
    markLinePaid(id, method, toISO(paidAt));
    refreshChargeStatus(charge_id);
    router.back();
  }

  const canConfirm = method !== null;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="p-4 gap-6"
      >
        {/* Header */}
        <ScreenHeader title={LABELS.pay.screenTitle} onBack={() => router.back()} />

        {/* Charge summary */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-4 border border-gray-100 dark:border-gray-700 gap-2">
          <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            {LABELS.pay.chargeHeader}
          </Text>
          <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">{concept}</Text>
          {contact_name ? (
            <Text className="text-sm text-gray-500 dark:text-gray-400">{contact_name}</Text>
          ) : null}
          <Text className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-1">
            {formatColones(parseInt(amount ?? "0", 10))}
          </Text>
        </View>

        {/* Método de pago */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {LABELS.pay.fieldPaymentMethod} <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row gap-2">
            {METHODS.map(({ value, label }) => {
              const selected = method === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => { setMethod(value); setError(null); }}
                  className={`flex-1 py-3 rounded-xl items-center border ${
                    selected ? "bg-blue-600 border-blue-600" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                  } active:opacity-70`}
                >
                  <Text className={`text-sm font-semibold ${selected ? "text-white" : "text-gray-700 dark:text-gray-300"}`}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Fecha de pago */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">{LABELS.pay.fieldPaymentDate}</Text>
          <Pressable
            onPress={() => setShowPicker(true)}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 active:opacity-70"
          >
            <Text className="text-base text-gray-900 dark:text-gray-100">{formatDate(toISO(paidAt))}</Text>
          </Pressable>

          {showPicker && (
            <DateTimePicker
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              value={paidAt}
              maximumDate={new Date()}
              onChange={(_, selected) => {
                if (Platform.OS === "android") setShowPicker(false);
                if (selected) setPaidAt(selected);
              }}
              locale="es-CR"
            />
          )}

          {showPicker && Platform.OS === "ios" && (
            <Pressable onPress={() => setShowPicker(false)} className="items-end">
              <Text className="text-blue-600 text-sm font-semibold py-1">{LABELS.common.done}</Text>
            </Pressable>
          )}
        </View>

        {/* Nota opcional */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {LABELS.pay.fieldNote} <Text className="text-gray-400 font-normal">{LABELS.common.optional}</Text>
          </Text>
          <TextInput
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-gray-100"
            placeholder={LABELS.pay.placeholderNote}
            placeholderTextColor="#6b7280"
            value={note}
            onChangeText={(t) => setNote(t.slice(0, 500))}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {error && (
          <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <Text className="text-red-600 dark:text-red-400 text-sm">{error}</Text>
          </View>
        )}

        {/* Confirmar */}
        <Pressable
          onPress={handleConfirm}
          disabled={!canConfirm}
          className={`rounded-xl py-4 items-center ${canConfirm ? "bg-green-600" : "bg-gray-200 dark:bg-gray-700"} active:opacity-70`}
        >
          <Text className={`text-base font-semibold ${canConfirm ? "text-white" : "text-gray-400 dark:text-gray-500"}`}>
            {LABELS.pay.confirmButton}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
