import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScreenHeader from "../../../components/ScreenHeader";
import { listTemplates, updateTemplate } from "../../../db/chargeTemplates";
import { LABELS } from "../../../constants/labels";
import type { LineType } from "../../../lib/types";

export default function EditTemplateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<LineType>("recurring");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tpl = listTemplates().find((t) => t.id === id);
    if (tpl) {
      setConcept(tpl.concept);
      setAmount(String(tpl.amount));
      setType(tpl.type);
    }
  }, [id]);

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
    updateTemplate(id, { concept: concept.trim(), amount: parseInt(amount, 10), type });
    router.back();
  }

  const canSave = concept.trim().length > 0 && amount.length > 0;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="p-4 gap-6">
        <ScreenHeader title={LABELS.templates.editTitle} onBack={() => router.back()} />

        {/* Concepto */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {LABELS.templates.fieldConcept} <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-gray-100"
            placeholder={LABELS.templates.placeholderConcept}
            placeholderTextColor="#6b7280"
            value={concept}
            onChangeText={(t) => { setConcept(t.slice(0, 200)); setError(null); }}
            autoFocus
            returnKeyType="next"
          />
        </View>

        {/* Monto */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {LABELS.templates.fieldAmount} <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-gray-100"
            placeholder={LABELS.templates.placeholderAmount}
            placeholderTextColor="#6b7280"
            value={amount}
            onChangeText={(t) => { setAmount(t.replace(/[^0-9]/g, "")); setError(null); }}
            keyboardType="number-pad"
            returnKeyType="done"
          />
        </View>

        {/* Tipo */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">{LABELS.templates.fieldType}</Text>
          <View className="flex-row gap-2">
            {([["recurring", LABELS.templates.typeRecurring], ["extra", LABELS.templates.typeExtra]] as const).map(([val, label]) => (
              <Pressable
                key={val}
                onPress={() => setType(val)}
                className={`flex-1 py-3 rounded-xl items-center border ${type === val ? "bg-blue-600 border-blue-600" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"} active:opacity-70`}
              >
                <Text className={`text-sm font-semibold ${type === val ? "text-white" : "text-gray-700 dark:text-gray-300"}`}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {error && (
          <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <Text className="text-red-600 dark:text-red-400 text-sm">{error}</Text>
          </View>
        )}

        {/* Guardar */}
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          className={`rounded-xl py-4 items-center ${canSave ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}`}
        >
          <Text className={`text-base font-semibold ${canSave ? "text-white" : "text-gray-400 dark:text-gray-500"}`}>
            {LABELS.common.saveChanges}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
