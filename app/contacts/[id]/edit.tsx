import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScreenHeader from "../../../components/ScreenHeader";
import { getContact, updateContact } from "../../../db/contacts";
import { LABELS } from "../../../constants/labels";

export default function EditContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const contact = getContact(id);
    if (!contact) { router.back(); return; }
    setName(contact.name);
    setPhone(contact.phone ?? "");
    setNotes(contact.notes ?? "");
  }, [id, router]);

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(LABELS.contacts.errorNameRequired);
      return;
    }
    setError(null);
    updateContact(id, {
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
        <ScreenHeader title={LABELS.contacts.editTitle} onBack={() => router.back()} />

        {/* Nombre */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">
            {LABELS.contacts.fieldName} <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder={LABELS.contacts.placeholderName}
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

        {/* Teléfono */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">{LABELS.contacts.fieldPhone}</Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder={LABELS.contacts.placeholderPhone}
            placeholderTextColor="#9ca3af"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            returnKeyType="next"
          />
        </View>

        {/* Notas */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700">{LABELS.contacts.fieldNotes}</Text>
          <TextInput
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder={LABELS.contacts.placeholderNotes}
            placeholderTextColor="#9ca3af"
            value={notes}
            onChangeText={(t) => setNotes(t.slice(0, 500))}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={styles.notesInput}
          />
        </View>

        {/* Guardar */}
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          className={`rounded-xl py-4 items-center ${canSave ? "bg-blue-600" : "bg-gray-200"}`}
        >
          <Text className={`text-base font-semibold ${canSave ? "text-white" : "text-gray-400"}`}>
            {LABELS.common.saveChanges}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  notesInput: { minHeight: 80 },
});
