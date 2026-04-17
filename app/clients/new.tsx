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
import { createClient } from "../../db/clients";

export default function NewClientScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("El nombre es obligatorio.");
      return;
    }
    setError(null);
    createClient({
      id: ExpoCrypto.randomUUID(),
      name: trimmedName,
      phone: phone.trim() || null,
      notes: notes.trim() || null,
    });
    router.back();
  }

  const canSave = name.trim().length > 0;

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
          <Text className="text-xl font-bold text-gray-900">Nuevo cliente</Text>
        </View>

        {/* Name */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">
            Nombre <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Ej: Ana Rodríguez"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={(t) => {
              setName(t.slice(0, 200));
              setError(null);
            }}
            autoFocus
            returnKeyType="next"
          />
          {error && <Text className="text-red-500 text-sm">{error}</Text>}
        </View>

        {/* Phone */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">Teléfono</Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Ej: +506 8888-1234"
            placeholderTextColor="#9ca3af"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            returnKeyType="next"
          />
        </View>

        {/* Notes */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">Notas</Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Observaciones opcionales..."
            placeholderTextColor="#9ca3af"
            value={notes}
            onChangeText={(t) => setNotes(t.slice(0, 500))}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ minHeight: 80 }}
          />
        </View>

        {/* Save button */}
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
    </KeyboardAvoidingView>
  );
}
