import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect, Link } from "expo-router";
import ScreenHeader from "../../../components/ScreenHeader";
import { getClient, deactivateClient } from "../../../db/clients";
import { listChargesByClient, unmarkPaid } from "../../../db/charges";
import { formatColones, formatDate } from "../../../lib/format";
import type { Client, Charge } from "../../../lib/types";
import { LABELS } from "../../../constants/labels";

const STATUS_LABEL: Record<string, string> = {
  pending: LABELS.status.pending,
  overdue: LABELS.status.overdue,
  paid: LABELS.status.paid,
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

function ChargeRow({ charge, onUnmark }: { charge: Charge; onUnmark: (id: string) => void }) {
  const canPay = charge.status === "pending" || charge.status === "overdue";
  const inner = (
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
        <Text className="text-sm text-gray-500">{LABELS.charges.duePrefix} {formatDate(charge.due_date)}</Text>
        <Text className="text-sm font-medium text-gray-700">{formatColones(charge.amount)}</Text>
      </View>
      {canPay && (
        <Text className="text-xs text-blue-500 font-medium mt-0.5">{LABELS.charges.tapToPayHint}</Text>
      )}
      {charge.status === "paid" && (
        <View className="flex-row items-center justify-between mt-0.5">
          <Text className="text-xs text-gray-400">
            {charge.paid_at ? `${LABELS.charges.paidPrefix} ${formatDate(charge.paid_at)}` : LABELS.status.paid}
            {charge.payment_method ? ` · ${charge.payment_method.toUpperCase()}` : ""}
          </Text>
          <Pressable
            onPress={() => onUnmark(charge.id)}
            hitSlop={12}
            className="active:opacity-50"
          >
            <Text className="text-xs text-red-400 font-medium">{LABELS.charges.revertButton}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  if (!canPay) return inner;

  return (
    <Link
      href={{
        pathname: "/charges/[id]/pay",
        params: {
          id: charge.id,
          concept: charge.concept,
          amount: String(charge.amount),
          client_name: charge.client_name ?? "",
        },
      }}
      asChild
    >
      <Pressable className="active:opacity-70">{inner}</Pressable>
    </Link>
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
  }, [id, router]);

  useFocusEffect(load);

  function handleUnmark(chargeId: string) {
    Alert.alert(
      LABELS.charges.revertAlertTitle,
      LABELS.charges.revertAlertMessage,
      [
        { text: LABELS.common.cancel, style: "cancel" },
        {
          text: LABELS.charges.revertButton,
          style: "destructive",
          onPress: () => {
            unmarkPaid(chargeId);
            load();
          },
        },
      ],
    );
  }

  function handleDelete() {
    Alert.alert(
      LABELS.clients.deleteAlertTitle,
      LABELS.clients.deleteAlertMessage(client?.name ?? ""),
      [
        { text: LABELS.common.cancel, style: "cancel" },
        {
          text: LABELS.common.delete,
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
      <ScreenHeader title="" onBack={() => router.back()} />

      {/* Info card */}
      <Pressable onPress={() => router.push(`/clients/${id}/edit`)} className="active:opacity-70">
      <View className="bg-white rounded-2xl px-4 py-4 border border-gray-100 gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">{client.name}</Text>
          <Text className="text-xl text-gray-300">›</Text>
        </View>
        {client.phone ? (
          <View className="gap-0.5">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{LABELS.clients.fieldPhone}</Text>
            <Text className="text-base text-gray-700">{client.phone}</Text>
          </View>
        ) : null}
        {client.notes ? (
          <View className="gap-0.5">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{LABELS.clients.fieldNotes}</Text>
            <Text className="text-base text-gray-700">{client.notes}</Text>
          </View>
        ) : null}
      </View>
      </Pressable>

      {/* Charges section */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-gray-700">
            {LABELS.charges.sectionTitle} {charges.length > 0 ? `(${charges.length})` : ""}
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
            <Text className="text-white text-sm font-semibold">{LABELS.charges.newButton}</Text>
          </Pressable>
        </View>

        {charges.length === 0 ? (
          <View className="bg-white rounded-2xl px-4 py-8 border border-gray-100 items-center gap-2">
            <Text className="text-3xl">📋</Text>
            <Text className="text-sm text-gray-400">{LABELS.charges.emptyState}</Text>
          </View>
        ) : (
          <View className="gap-2">
            {charges.map((charge) => (
              <ChargeRow key={charge.id} charge={charge} onUnmark={handleUnmark} />
            ))}
          </View>
        )}
      </View>

      {/* Danger zone */}
      <Pressable
        onPress={handleDelete}
        className="rounded-xl py-4 items-center border border-red-200 active:opacity-70"
      >
        <Text className="text-red-500 text-base font-semibold">{LABELS.clients.deleteButton}</Text>
      </Pressable>
    </ScrollView>
  );
}
