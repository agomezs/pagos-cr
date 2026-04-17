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
import { markPaid } from "../../../db/charges";
import { formatColones, formatDate } from "../../../lib/format";
import type { PaymentMethod } from "../../../lib/types";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "sinpe", label: "SINPE" },
  { value: "transfer", label: "Transferencia" },
  { value: "cash", label: "Efectivo" },
];

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function PayChargeScreen() {
  const { id, concept, amount, client_name } = useLocalSearchParams<{
    id: string;
    concept: string;
    amount: string;
    client_name: string;
  }>();
  const router = useRouter();

  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [note, setNote] = useState("");
  const [paidAt, setPaidAt] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    if (!method) {
      setError("Seleccioná el método de pago.");
      return;
    }
    setError(null);
    markPaid(id, method, note.trim() || null, toISO(paidAt));
    router.back();
  }

  const canConfirm = method !== null;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="p-4 gap-6"
      >
        {/* Header */}
        <View className="flex-row items-center gap-3 pt-12 pb-2">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text className="text-blue-600 text-base font-medium">← Volver</Text>
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">Registrar pago</Text>
        </View>

        {/* Charge summary */}
        <View className="bg-white rounded-2xl px-4 py-4 border border-gray-100 gap-2">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Cobro
          </Text>
          <Text className="text-base font-semibold text-gray-900">{concept}</Text>
          {client_name ? (
            <Text className="text-sm text-gray-500">{client_name}</Text>
          ) : null}
          <Text className="text-lg font-bold text-gray-800 mt-1">
            {formatColones(parseInt(amount ?? "0", 10))}
          </Text>
        </View>

        {/* Método de pago */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-gray-700">
            Método de pago <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row gap-2">
            {METHODS.map(({ value, label }) => {
              const selected = method === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => {
                    setMethod(value);
                    setError(null);
                  }}
                  className={`flex-1 py-3 rounded-xl items-center border ${
                    selected
                      ? "bg-blue-600 border-blue-600"
                      : "bg-white border-gray-200"
                  } active:opacity-70`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selected ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Fecha de pago */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">Fecha de pago</Text>
          <Pressable
            onPress={() => setShowPicker(true)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 active:opacity-70"
          >
            <Text className="text-base text-gray-900">{formatDate(toISO(paidAt))}</Text>
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
              <Text className="text-blue-600 text-sm font-semibold py-1">Listo</Text>
            </Pressable>
          )}
        </View>

        {/* Nota opcional */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">
            Nota <Text className="text-gray-400 font-normal">(opcional)</Text>
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Ej: Confirmado por WhatsApp"
            placeholderTextColor="#9ca3af"
            value={note}
            onChangeText={(t) => setNote(t.slice(0, 500))}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {error && (
          <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <Text className="text-red-600 text-sm">{error}</Text>
          </View>
        )}

        {/* Confirmar */}
        <Pressable
          onPress={handleConfirm}
          disabled={!canConfirm}
          className={`rounded-xl py-4 items-center ${
            canConfirm ? "bg-green-600" : "bg-gray-200"
          } active:opacity-70`}
        >
          <Text
            className={`text-base font-semibold ${
              canConfirm ? "text-white" : "text-gray-400"
            }`}
          >
            Confirmar pago
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
