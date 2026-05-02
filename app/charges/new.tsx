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
import ScreenHeader from "../../components/ScreenHeader";
import { createCharge } from "../../db/charges";
import { createLine } from "../../db/chargeLines";
import { listTemplates } from "../../db/chargeTemplates";
import { formatDate } from "../../lib/format";
import type { ChargeTemplate } from "../../lib/types";
import TemplatePickerModal from "../../components/TemplatePickerModal";
import { LABELS } from "../../constants/labels";

export default function NewChargeScreen() {
  const { contact_id, contact_name } = useLocalSearchParams<{
    contact_id: string;
    contact_name: string;
  }>();
  const router = useRouter();

  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [lineType, setLineType] = useState<"recurring" | "extra">("recurring");
  const [description, setDescription] = useState("");
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
    setLineType(tpl.type);
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
    if (!concept.trim()) return LABELS.charges.errorConceptRequired;
    const amt = parseInt(amount, 10);
    if (!amount || isNaN(amt) || amt <= 0) return LABELS.charges.errorAmountInvalid;
    if (!dueDate) return LABELS.charges.errorDueDateRequired;
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    const chargeId = ExpoCrypto.randomUUID();
    const iso = toISO(dueDate!);
    const period = iso.slice(0, 7); // YYYY-MM from the due date
    createCharge({ id: chargeId, contact_id, period, due_date: iso });
    createLine({
      id: ExpoCrypto.randomUUID(),
      charge_id: chargeId,
      concept: concept.trim(),
      amount: parseInt(amount, 10),
      description: description.trim() || null,
      type: lineType,
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
        <ScreenHeader title={LABELS.charges.newTitle} onBack={() => router.back()} />

        {/* Contacto (read-only) */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">{LABELS.charges.fieldContact}</Text>
          <View className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3">
            <Text className="text-base text-gray-600">{contact_name ?? contact_id}</Text>
          </View>
        </View>

        {/* Template picker trigger */}
        <Pressable
          onPress={openTemplatePicker}
          className="border border-blue-200 bg-blue-50 rounded-xl px-4 py-3 flex-row items-center justify-between active:opacity-70"
        >
          <Text className="text-blue-700 text-sm font-medium">{LABELS.charges.useTemplate}</Text>
          <Text className="text-blue-400 text-sm">›</Text>
        </Pressable>

        {/* Concepto */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">
            {LABELS.charges.fieldConcept} <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder={LABELS.charges.placeholderConcept}
            placeholderTextColor="#9ca3af"
            value={concept}
            onChangeText={(t) => { setConcept(t.slice(0, 200)); setError(null); }}
            autoFocus
            returnKeyType="next"
          />
        </View>

        {/* Descripción (opcional) */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">
            {LABELS.charges.fieldDescription} <Text className="text-gray-400 font-normal">{LABELS.common.optional}</Text>
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder={LABELS.charges.placeholderDescription}
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            returnKeyType="next"
          />
        </View>

        {/* Monto */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">
            {LABELS.charges.fieldAmount} <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder={LABELS.charges.placeholderAmount}
            placeholderTextColor="#9ca3af"
            value={amount}
            onChangeText={(t) => { setAmount(t.replace(/[^0-9]/g, "")); setError(null); }}
            keyboardType="number-pad"
            returnKeyType="done"
          />
        </View>

        {/* Tipo */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-gray-700">{LABELS.charges.fieldLineType}</Text>
          <View className="flex-row gap-2">
            {([["recurring", LABELS.charges.lineTypeRecurring], ["extra", LABELS.charges.lineTypeExtra]] as const).map(([val, label]) => (
              <Pressable
                key={val}
                onPress={() => setLineType(val)}
                className={`flex-1 py-3 rounded-xl items-center border ${lineType === val ? "bg-blue-600 border-blue-600" : "bg-white border-gray-200"} active:opacity-70`}
              >
                <Text className={`text-sm font-semibold ${lineType === val ? "text-white" : "text-gray-700"}`}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Fecha de vencimiento */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">
            {LABELS.charges.fieldDueDate} <Text className="text-red-500">*</Text>
          </Text>
          <Pressable
            onPress={() => setShowPicker(true)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 active:opacity-70"
          >
            <Text className={dueDate ? "text-base text-gray-900" : "text-base text-gray-400"}>
              {dueDate ? formatDate(toISO(dueDate)) : LABELS.charges.placeholderDueDate}
            </Text>
          </Pressable>

          {showPicker && (
            <DateTimePicker
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              value={dueDate ?? new Date()}
              onChange={(_, selected) => {
                if (Platform.OS === "android") setShowPicker(false);
                if (selected) { setDueDate(selected); setError(null); }
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
            {LABELS.common.save}
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
