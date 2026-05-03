import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import ScreenHeader from "../../../components/ScreenHeader";
import { getContact } from "../../../db/contacts";
import { listChargesByContact, refreshChargeStatus } from "../../../db/charges";
import { unmarkLinePaid } from "../../../db/chargeLines";
import { formatColones, formatDate, formatPeriod } from "../../../lib/format";
import type { Contact, Charge, ChargeLine } from "../../../lib/types";
import { LABELS } from "../../../constants/labels";

const STATUS_COLOR: Record<string, string> = {
  pending: "text-yellow-600",
  overdue: "text-red-600",
  paid: "text-green-600",
};

const STATUS_LABEL: Record<string, string> = {
  pending: LABELS.status.pending,
  overdue: LABELS.status.overdue,
  paid: LABELS.status.paid,
};

const STATUS_BG: Record<string, string> = {
  pending: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800",
  overdue: "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800",
  paid: "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800",
};

function LineRow({ line, onPay, onUnmark }: {
  line: ChargeLine;
  onPay: (line: ChargeLine) => void;
  onUnmark: (id: string, charge_id: string) => void;
}) {
  const canPay = line.status === "pending" || line.status === "overdue";
  return (
    <Pressable
      onPress={() => canPay ? onPay(line) : undefined}
      className={`rounded-xl px-4 py-3 border gap-1 ${STATUS_BG[line.status] ?? "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"} active:opacity-70`}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1 mr-2" numberOfLines={1}>
          {line.concept}
        </Text>
        <Text className={`text-xs font-semibold ${STATUS_COLOR[line.status] ?? "text-gray-600"}`}>
          {STATUS_LABEL[line.status] ?? line.status}
        </Text>
      </View>
      {line.description ? (
        <Text className="text-xs text-gray-500 dark:text-gray-400">{line.description}</Text>
      ) : null}
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-gray-400 dark:text-gray-500">
          {line.type === "recurring" ? LABELS.charges.lineTypeRecurring : LABELS.charges.lineTypeExtra}
        </Text>
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatColones(line.amount)}</Text>
      </View>
      {canPay && (
        <Text className="text-xs text-blue-500 font-medium mt-0.5">{LABELS.charges.tapToPayHint}</Text>
      )}
      {line.status === "paid" && (
        <View className="flex-row items-center justify-between mt-0.5">
          <Text className="text-xs text-gray-400 dark:text-gray-500">
            {line.paid_at ? `${LABELS.charges.paidPrefix} ${formatDate(line.paid_at)}` : LABELS.status.paid}
            {line.payment_method ? ` · ${line.payment_method.toUpperCase()}` : ""}
          </Text>
          <Pressable onPress={() => onUnmark(line.id, line.charge_id)} hitSlop={12} className="active:opacity-50">
            <Text className="text-xs text-red-400 font-medium">{LABELS.charges.revertButton}</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

function ChargeSection({ charge, onPay, onUnmark }: {
  charge: Charge;
  onPay: (line: ChargeLine) => void;
  onUnmark: (lineId: string, charge_id: string) => void;
}) {
  const lines = charge.lines ?? [];
  const unpaidTotal = lines.filter((l) => l.status !== "paid").reduce((s, l) => s + l.amount, 0);

  return (
    <View className={`rounded-2xl border overflow-hidden ${STATUS_BG[charge.status] ?? "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"}`}>
      {/* Charge header */}
      <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
        <Text className="text-xs font-semibold text-gray-500">
          {LABELS.charges.duePrefix} {formatDate(charge.due_date)}
        </Text>
        <Text className={`text-xs font-bold ${STATUS_COLOR[charge.status] ?? "text-gray-600"}`}>
          {STATUS_LABEL[charge.status] ?? charge.status}
          {charge.status !== "paid" ? `  ${formatColones(unpaidTotal)}` : ""}
        </Text>
      </View>
      {/* Lines */}
      <View className="px-3 pb-3 gap-2">
        {lines.map((line) => (
          <LineRow key={line.id} line={line} onPay={onPay} onUnmark={onUnmark} />
        ))}
      </View>
    </View>
  );
}

export default function ContactHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);

  const load = useCallback(() => {
    const c = getContact(id);
    if (!c) { router.back(); return; }
    setContact(c);
    setCharges(listChargesByContact(id));
  }, [id, router]);

  useFocusEffect(load);

  function handlePay(line: ChargeLine) {
    router.push({
      pathname: "/charges/[id]/pay",
      params: {
        id: line.id,
        concept: line.concept,
        amount: String(line.amount),
        contact_name: contact?.name ?? "",
        charge_id: line.charge_id,
      },
    });
  }

  function handleUnmark(lineId: string, charge_id: string) {
    Alert.alert(
      LABELS.charges.revertAlertTitle,
      LABELS.charges.revertAlertMessage,
      [
        { text: LABELS.common.cancel, style: "cancel" },
        {
          text: LABELS.charges.revertButton,
          style: "destructive",
          onPress: () => {
            unmarkLinePaid(lineId);
            refreshChargeStatus(charge_id);
            load();
          },
        },
      ],
    );
  }

  if (!contact) return null;

  // Group charges by period, sorted desc
  const byPeriod = new Map<string, Charge[]>();
  for (const charge of charges) {
    const list = byPeriod.get(charge.period) ?? [];
    list.push(charge);
    byPeriod.set(charge.period, list);
  }
  const periods = Array.from(byPeriod.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900" contentContainerClassName="p-4 gap-6">
      {/* Header */}
      <ScreenHeader title={LABELS.charges.historySectionTitle} onBack={() => router.back()} />

      <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">{contact.name}</Text>

      {charges.length === 0 ? (
        <View className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-8 border border-gray-100 dark:border-gray-700 items-center gap-2">
          <Text className="text-3xl">📋</Text>
          <Text className="text-sm text-gray-400 dark:text-gray-500">{LABELS.charges.emptyState}</Text>
        </View>
      ) : (
        periods.map((period) => (
          <View key={period} className="gap-3">
            {/* Period header */}
            <Text className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {formatPeriod(period)}
            </Text>
            {(byPeriod.get(period) ?? []).map((charge) => (
              <ChargeSection key={charge.id} charge={charge} onPay={handlePay} onUnmark={handleUnmark} />
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}
