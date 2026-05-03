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
  const [email, setEmail] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const contact = getContact(id);
    if (!contact) { router.back(); return; }
    setName(contact.name);
    setPhone(contact.phone ?? "");
    setEmail(contact.email ?? "");
    setMonthlyAmount(contact.monthly_amount != null ? String(contact.monthly_amount) : "");
    setNotes(contact.notes ?? "");
  }, [id, router]);

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(LABELS.contacts.errorNameRequired);
      return;
    }
    setError(null);
    const amt = parseInt(monthlyAmount, 10);
    updateContact(id, {
      name: trimmedName,
      phone: phone.trim() || null,
      email: email.trim() || null,
      notes: notes.trim() || null,
      monthly_amount: monthlyAmount && !isNaN(amt) && amt > 0 ? amt : null,
    });
    router.back();
  }

  const canSave = name.trim().length > 0;

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
        <ScreenHeader title={LABELS.contacts.editTitle} onBack={() => router.back()} />

        {/* Nombre */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {LABELS.contacts.fieldName} <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-gray-100"
            placeholder={LABELS.contacts.placeholderName}
            placeholderTextColor="#6b7280"
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
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">{LABELS.contacts.fieldPhone}</Text>
          <TextInput
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-gray-100"
            placeholder={LABELS.contacts.placeholderPhone}
            placeholderTextColor="#6b7280"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            returnKeyType="next"
          />
        </View>

        {/* Email */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">{LABELS.contacts.fieldEmail}</Text>
          <TextInput
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-gray-100"
            placeholder={LABELS.contacts.placeholderEmail}
            placeholderTextColor="#6b7280"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />
        </View>

        {/* Mensualidad */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">{LABELS.contacts.fieldMonthlyAmount}</Text>
          <TextInput
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-gray-100"
            placeholder={LABELS.contacts.placeholderMonthlyAmount}
            placeholderTextColor="#6b7280"
            value={monthlyAmount}
            onChangeText={(t) => setMonthlyAmount(t.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            returnKeyType="next"
          />
        </View>

        {/* Notas */}
        <View className="gap-1.5">
          <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">{LABELS.contacts.fieldNotes}</Text>
          <TextInput
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-gray-100"
            placeholder={LABELS.contacts.placeholderNotes}
            placeholderTextColor="#6b7280"
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

const styles = StyleSheet.create({
  notesInput: { minHeight: 80 },
});
