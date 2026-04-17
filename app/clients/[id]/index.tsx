import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { getClient, deactivateClient } from "../../../db/clients";
import { listChargesByClient } from "../../../db/charges";
import { formatColones, formatDate } from "../../../lib/format";
import type { Client, Charge } from "../../../lib/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  overdue: "Vencido",
  paid: "Pagado",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-yellow-600",
  overdue: "text-red-600",
  paid: "text-green-600",
};

const STATUS_BG: Record<string, string> = {
  pending: "bg-yellow-50 border-yellow-100",
  overdue: "bg-red-50 border-red-100",
  paid: "bg-green-50 border-green-100",
};

function ChargeRow({ charge }: { charge: Charge }) {
  return (
    <View className={`rounded-xl px-4 py-3 border gap-1 ${STATUS_BG[charge.status] ?? "bg-white border-gray-100"}`}>
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-gray-900 flex-1 mr-2" numberOfLines={1}>
          {charge.concept}
        </Text>
        <Text className={`text-sm font-semibold ${STATUS_COLOR[charge.status] ?? "text-gray-600"}`}>
          {STATUS_LABEL[charge.status] ?? charge.status}
        </Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-gray-500">Vence: {formatDate(charge.due_date)}</Text>
        <Text className="text-sm font-medium text-gray-700">{formatColones(charge.amount)}</Text>
      </View>
    </View>
  );
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);

  const load = useCallback(() => {
    const c = getClient(id);
    if (!c) {
      router.back();
      return;
    }
    setClient(c);
    setCharges(listChargesByClient(id));
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

      {/* Charges section */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-gray-700">
            Cobros {charges.length > 0 ? `(${charges.length})` : ""}
          </Text>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/charges/new",
                params: { client_id: id, client_name: client.name },
              })
            }
            className="bg-blue-600 px-3 py-1.5 rounded-lg active:opacity-70"
          >
            <Text className="text-white text-sm font-semibold">+ Nuevo cobro</Text>
          </Pressable>
        </View>

        {charges.length === 0 ? (
          <View className="bg-white rounded-2xl px-4 py-8 border border-gray-100 items-center gap-2">
            <Text className="text-3xl">📋</Text>
            <Text className="text-sm text-gray-400">Sin cobros registrados</Text>
          </View>
        ) : (
          <View className="gap-2">
            {charges.map((charge) => (
              <ChargeRow key={charge.id} charge={charge} />
            ))}
          </View>
        )}
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
