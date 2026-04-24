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
import { useRouter } from "expo-router";
import ScreenHeader from "../../components/ScreenHeader";
import { createTemplate } from "../../db/chargeTemplates";
import { LABELS } from "../../constants/labels";
import type { LineType } from "../../lib/types";

export default function NewTemplateScreen() {
  const router = useRouter();
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<LineType>("recurring");
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!concept.trim()) return LABELS.templates.errorConceptRequired;
    const amt = parseInt(amount, 10);
    if (!amount || isNaN(amt) || amt <= 0) return LABELS.templates.errorAmountInvalid;
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    createTemplate({
      id: ExpoCrypto.randomUUID(),
      concept: concept.trim(),
      amount: parseInt(amount, 10),
      type,
    });
    router.back();
  }

  const canSave = concept.trim().length > 0 && amount.length > 0;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="p-4 gap-6">
        <ScreenHeader title={LABELS.templates.newTitle} onBack={() => router.back()} />

        {/* Concepto */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">
            {LABELS.templates.fieldConcept} <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder={LABELS.templates.placeholderConcept}
            placeholderTextColor="#9ca3af"
            value={concept}
            onChangeText={(t) => { setConcept(t.slice(0, 200)); setError(null); }}
            autoFocus
            returnKeyType="next"
          />
        </View>

        {/* Monto */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">
            {LABELS.templates.fieldAmount} <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder={LABELS.templates.placeholderAmount}
            placeholderTextColor="#9ca3af"
            value={amount}
            onChangeText={(t) => { setAmount(t.replace(/[^0-9]/g, "")); setError(null); }}
            keyboardType="number-pad"
            returnKeyType="done"
          />
        </View>

        {/* Tipo */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-gray-700">{LABELS.templates.fieldType}</Text>
          <View className="flex-row gap-2">
            {([["recurring", LABELS.templates.typeRecurring], ["extra", LABELS.templates.typeExtra]] as const).map(([val, label]) => (
              <Pressable
                key={val}
                onPress={() => setType(val)}
                className={`flex-1 py-3 rounded-xl items-center border ${type === val ? "bg-blue-600 border-blue-600" : "bg-white border-gray-200"} active:opacity-70`}
              >
                <Text className={`text-sm font-semibold ${type === val ? "text-white" : "text-gray-700"}`}>{label}</Text>
              </Pressable>
            ))}
          </View>
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
    </KeyboardAvoidingView>
  );
}
