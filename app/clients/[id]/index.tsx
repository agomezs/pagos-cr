import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { getClient, deactivateClient } from "../../../db/clients";
import type { Client } from "../../../lib/types";

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);

  const load = useCallback(() => {
    const c = getClient(id);
    if (!c) {
      router.back();
      return;
    }
    setClient(c);
  }, [id]);

  useFocusEffect(load);

  function handleDelete() {
    Alert.alert(
      "Eliminar cliente",
      `¿Desactivar a ${client?.name}? Sus cobros se conservarán.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            deactivateClient(id);
            router.back();
          },
        },
      ],
    );
  }

  if (!client) return null;

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="p-4 gap-6">
      {/* Header */}
      <View className="flex-row items-center justify-between pt-12 pb-2">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-blue-600 text-base font-medium">← Volver</Text>
        </Pressable>
        <Pressable onPress={() => router.push(`/clients/${id}/edit`)} hitSlop={12}>
          <Text className="text-blue-600 text-base font-medium">Editar</Text>
        </Pressable>
      </View>

      {/* Info card */}
      <View className="bg-white rounded-2xl px-4 py-4 border border-gray-100 gap-3">
        <Text className="text-2xl font-bold text-gray-900">{client.name}</Text>
        {client.phone ? (
          <View className="gap-0.5">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Teléfono</Text>
            <Text className="text-base text-gray-700">{client.phone}</Text>
          </View>
        ) : null}
        {client.notes ? (
          <View className="gap-0.5">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Notas</Text>
            <Text className="text-base text-gray-700">{client.notes}</Text>
          </View>
        ) : null}
      </View>

      {/* Charges placeholder — filled in Slice 3 */}
      <View className="gap-2">
        <Text className="text-base font-semibold text-gray-700">Cobros</Text>
        <View className="bg-white rounded-2xl px-4 py-8 border border-gray-100 items-center gap-2">
          <Text className="text-3xl">📋</Text>
          <Text className="text-sm text-gray-400">Sin cobros registrados</Text>
        </View>
      </View>

      {/* Danger zone */}
      <Pressable
        onPress={handleDelete}
        className="rounded-xl py-4 items-center border border-red-200 active:opacity-70"
      >
        <Text className="text-red-500 text-base font-semibold">Eliminar cliente</Text>
      </Pressable>
    </ScrollView>
  );
}
