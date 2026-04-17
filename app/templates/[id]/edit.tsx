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
import { listTemplates, updateTemplate } from "../../../db/chargeTemplates";

export default function EditTemplateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tpl = listTemplates().find((t) => t.id === id);
    if (tpl) {
      setConcept(tpl.concept);
      setAmount(String(tpl.amount));
    }
  }, [id]);

  function validate(): string | null {
    if (!concept.trim()) return "El concepto es obligatorio.";
    const amt = parseInt(amount, 10);
    if (!amount || isNaN(amt) || amt <= 0) return "El monto debe ser un número mayor a 0.";
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    updateTemplate(id, { concept: concept.trim(), amount: parseInt(amount, 10) });
    router.back();
  }

  const canSave = concept.trim().length > 0 && amount.length > 0;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="p-4 gap-6">
        <View className="flex-row items-center gap-3 pt-12 pb-2">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text className="text-blue-600 text-base font-medium">← Volver</Text>
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">Editar plantilla</Text>
        </View>

        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">
            Concepto <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Ej: Mensualidad mayo"
            placeholderTextColor="#9ca3af"
            value={concept}
            onChangeText={(t) => { setConcept(t.slice(0, 200)); setError(null); }}
            autoFocus
            returnKeyType="next"
          />
        </View>

        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">
            Monto (₡) <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Ej: 35000"
            placeholderTextColor="#9ca3af"
            value={amount}
            onChangeText={(t) => { setAmount(t.replace(/[^0-9]/g, "")); setError(null); }}
            keyboardType="number-pad"
            returnKeyType="done"
          />
        </View>

        {error && (
          <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <Text className="text-red-600 text-sm">{error}</Text>
          </View>
        )}

        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          className={`rounded-xl py-4 items-center ${canSave ? "bg-blue-600" : "bg-gray-200"}`}
        >
          <Text className={`text-base font-semibold ${canSave ? "text-white" : "text-gray-400"}`}>
            Guardar cambios
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
