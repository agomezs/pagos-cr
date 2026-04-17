import { useState } from "react";
import * as ExpoCrypto from "expo-crypto";
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
import { createCharge } from "../../db/charges";
import { listTemplates } from "../../db/chargeTemplates";
import { formatDate } from "../../lib/format";
import type { ChargeTemplate } from "../../lib/types";
import TemplatePickerModal from "../../components/TemplatePickerModal";

export default function NewChargeScreen() {
  const { client_id, client_name } = useLocalSearchParams<{
    client_id: string;
    client_name: string;
  }>();
  const router = useRouter();

  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<ChargeTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);

  function openTemplatePicker() {
    setTemplates(listTemplates());
    setShowTemplates(true);
  }

  function applyTemplate(tpl: ChargeTemplate) {
    setConcept(tpl.concept);
    setAmount(String(tpl.amount));
    setError(null);
    setShowTemplates(false);
  }

  function toISO(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function validate(): string | null {
    if (!concept.trim()) return "El concepto es obligatorio.";
    const amt = parseInt(amount, 10);
    if (!amount || isNaN(amt) || amt <= 0) return "El monto debe ser un número mayor a 0.";
    if (!dueDate) return "La fecha de vencimiento es obligatoria.";
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    createCharge({
      id: ExpoCrypto.randomUUID(),
      client_id,
      concept: concept.trim(),
      amount: parseInt(amount, 10),
      due_date: toISO(dueDate!),
    });
    router.back();
  }

  const canSave = concept.trim().length > 0 && amount.length > 0 && dueDate !== null;

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
          <Text className="text-xl font-bold text-gray-900">Nuevo cobro</Text>
        </View>

        {/* Cliente (read-only) */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">Cliente</Text>
          <View className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3">
            <Text className="text-base text-gray-600">{client_name ?? client_id}</Text>
          </View>
        </View>

        {/* Template picker trigger */}
        <Pressable
          onPress={openTemplatePicker}
          className="border border-blue-200 bg-blue-50 rounded-xl px-4 py-3 flex-row items-center justify-between active:opacity-70"
        >
          <Text className="text-blue-700 text-sm font-medium">Usar plantilla</Text>
          <Text className="text-blue-400 text-sm">›</Text>
        </Pressable>

        {/* Concepto */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">
            Concepto <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Ej: Mensualidad mayo"
            placeholderTextColor="#9ca3af"
            value={concept}
            onChangeText={(t) => {
              setConcept(t.slice(0, 200));
              setError(null);
            }}
            autoFocus
            returnKeyType="next"
          />
        </View>

        {/* Monto */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">
            Monto (₡) <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Ej: 35000"
            placeholderTextColor="#9ca3af"
            value={amount}
            onChangeText={(t) => {
              setAmount(t.replace(/[^0-9]/g, ""));
              setError(null);
            }}
            keyboardType="number-pad"
            returnKeyType="done"
          />
        </View>

        {/* Fecha de vencimiento */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">
            Fecha de vencimiento <Text className="text-red-500">*</Text>
          </Text>
          <Pressable
            onPress={() => setShowPicker(true)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 active:opacity-70"
          >
            <Text className={dueDate ? "text-base text-gray-900" : "text-base text-gray-400"}>
              {dueDate ? formatDate(toISO(dueDate)) : "Seleccionar fecha"}
            </Text>
          </Pressable>

          {showPicker && (
            <DateTimePicker
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              value={dueDate ?? new Date()}
              onChange={(_, selected) => {
                if (Platform.OS === "android") setShowPicker(false);
                if (selected) {
                  setDueDate(selected);
                  setError(null);
                }
              }}
              locale="es-CR"
            />
          )}

          {/* iOS: confirm button to dismiss spinner */}
          {showPicker && Platform.OS === "ios" && (
            <Pressable
              onPress={() => setShowPicker(false)}
              className="items-end"
            >
              <Text className="text-blue-600 text-sm font-semibold py-1">Listo</Text>
            </Pressable>
          )}
        </View>

        {error && (
          <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <Text className="text-red-600 text-sm">{error}</Text>
          </View>
        )}

        {/* Guardar */}
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          className={`rounded-xl py-4 items-center ${canSave ? "bg-blue-600" : "bg-gray-200"}`}
        >
          <Text className={`text-base font-semibold ${canSave ? "text-white" : "text-gray-400"}`}>
            Guardar
          </Text>
        </Pressable>
      </ScrollView>

      <TemplatePickerModal
        visible={showTemplates}
        templates={templates}
        onSelect={applyTemplate}
        onClose={() => setShowTemplates(false)}
      />
    </KeyboardAvoidingView>
  );
}
