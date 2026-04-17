import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { markOverdue, getSummary, listCharges, createCharge } from "../db/charges";
import { createClient, listClients } from "../db/clients";
import { getDb } from "../db/database";
import { formatColones, formatDate } from "../lib/format";
import type { Charge, ChargeStatus, Summary } from "../lib/types";

// ---------------------------------------------------------------------------
// Seed helper — inserts demo data on first run
// ---------------------------------------------------------------------------
function seedIfEmpty() {
  const clients = listClients();
  if (clients.length > 0) return;

  const c1 = { id: "c1", name: "Ana Rodríguez", phone: "88001234", notes: null };
  const c2 = { id: "c2", name: "Luis Pérez", phone: "88005678", notes: null };
  const c3 = { id: "c3", name: "María Castro", phone: null, notes: null };

  createClient(c1);
  createClient(c2);
  createClient(c3);

  createCharge({ id: "co1", client_id: "c1", concept: "Mensualidad mayo", amount: 35000, due_date: "2026-05-01" });
  createCharge({ id: "co2", client_id: "c2", concept: "Mensualidad mayo", amount: 35000, due_date: "2026-05-01" });
  createCharge({ id: "co3", client_id: "c3", concept: "Mensualidad mayo", amount: 40000, due_date: "2026-05-15" });
  createCharge({ id: "co4", client_id: "c1", concept: "Mensualidad abril", amount: 35000, due_date: "2026-04-01" });
  createCharge({ id: "co5", client_id: "c3", concept: "Mensualidad marzo", amount: 40000, due_date: "2026-03-01" });
  createCharge({ id: "co6", client_id: "c2", concept: "Mensualidad abril", amount: 35000, due_date: "2026-04-01" });

  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE charges SET status='paid', payment_method='sinpe', paid_at='2026-04-02', updated_at=? WHERE id='co6'`,
    now,
  );
}

// ---------------------------------------------------------------------------
// SummaryPanel
// ---------------------------------------------------------------------------
type StatCardProps = { label: string; count: number; amount: number; color: string };

function StatCard({ label, count, amount, color }: StatCardProps) {
  return (
    <View className={`flex-1 rounded-2xl p-4 gap-1 ${color}`}>
      <Text className="text-xs font-semibold text-white/80 uppercase tracking-wide">{label}</Text>
      <Text className="text-2xl font-bold text-white">{formatColones(amount)}</Text>
      <Text className="text-xs text-white/70">{count} charge{count !== 1 ? "s" : ""}</Text>
    </View>
  );
}

function SummaryPanel({ summary }: { summary: Summary }) {
  return (
    <View className="px-4 pt-4 pb-2 gap-3">
      <Text className="text-xl font-bold text-gray-900">Dashboard</Text>
      <View className="flex-row gap-3">
        <StatCard label="Pending" count={summary.pendingCount} amount={summary.totalPending} color="bg-blue-500" />
        <StatCard label="Overdue" count={summary.overdueCount} amount={summary.totalOverdue} color="bg-red-500" />
      </View>
      <View className="flex-row gap-3">
        <StatCard label="Paid" count={summary.paidCount} amount={summary.totalPaid} color="bg-green-600" />
        <View className="flex-1 rounded-2xl p-4 bg-gray-100 gap-1 justify-center">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total owed</Text>
          <Text className="text-xl font-bold text-gray-800">
            {formatColones(summary.totalPending + summary.totalOverdue)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// FilterBar
// ---------------------------------------------------------------------------
const FILTERS: { label: string; value: ChargeStatus | null }[] = [
  { label: "All", value: null },
  { label: "Pending", value: "pending" },
  { label: "Overdue", value: "overdue" },
  { label: "Paid", value: "paid" },
];

function FilterBar({
  active,
  onChange,
}: {
  active: ChargeStatus | null;
  onChange: (v: ChargeStatus | null) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-4 py-2 gap-2"
    >
      {FILTERS.map((f) => {
        const selected = active === f.value;
        return (
          <Pressable
            key={String(f.value)}
            onPress={() => onChange(f.value)}
            className={`px-4 py-1.5 rounded-full border ${
              selected ? "bg-gray-900 border-gray-900" : "bg-white border-gray-200"
            }`}
          >
            <Text className={`text-sm font-medium ${selected ? "text-white" : "text-gray-600"}`}>
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// ChargeCard
// ---------------------------------------------------------------------------
const STATUS_STYLE: Record<ChargeStatus, { badge: string; text: string; label: string }> = {
  pending: { badge: "bg-blue-100", text: "text-blue-700", label: "Pending" },
  overdue: { badge: "bg-red-100",  text: "text-red-700",  label: "Overdue" },
  paid:    { badge: "bg-green-100", text: "text-green-700", label: "Paid" },
};

function ChargeCard({ charge }: { charge: Charge }) {
  const style = STATUS_STYLE[charge.status];
  return (
    <View className="mx-4 mb-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1 gap-0.5">
          <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
            {charge.client_name}
          </Text>
          <Text className="text-sm text-gray-500" numberOfLines={1}>
            {charge.concept}
          </Text>
        </View>
        <View className={`px-2.5 py-1 rounded-full ${style.badge}`}>
          <Text className={`text-xs font-semibold ${style.text}`}>{style.label}</Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-end justify-between">
        <View className="gap-0.5">
          <Text className="text-xs text-gray-400">
            {charge.status === "paid" && charge.paid_at
              ? `Paid on ${formatDate(charge.paid_at)}`
              : `Due ${formatDate(charge.due_date)}`}
          </Text>
          {charge.payment_method && (
            <Text className="text-xs text-gray-400 capitalize">{charge.payment_method}</Text>
          )}
        </View>
        <Text className="text-lg font-bold text-gray-900">{formatColones(charge.amount)}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const [summary, setSummary] = useState<Summary>({
    totalPending: 0,
    totalOverdue: 0,
    totalPaid: 0,
    pendingCount: 0,
    overdueCount: 0,
    paidCount: 0,
  });
  const [charges, setCharges] = useState<Charge[]>([]);
  const [statusFilter, setStatusFilter] = useState<ChargeStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    markOverdue();
    setSummary(getSummary());
    setCharges(listCharges({ status: statusFilter }));
  }, [statusFilter]);

  useEffect(() => {
    seedIfEmpty();
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    load();
  }, [statusFilter, load]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      stickyHeaderIndices={[1]}
    >
      <SummaryPanel summary={summary} />

      <View className="bg-gray-50">
        <FilterBar active={statusFilter} onChange={setStatusFilter} />
      </View>

      <View className="pt-2 pb-8">
        {charges.length === 0 ? (
          <View className="items-center py-16 gap-2">
            <Text className="text-4xl">📋</Text>
            <Text className="text-base font-medium text-gray-500">No charges</Text>
            <Text className="text-sm text-gray-400">
              {statusFilter ? `No ${statusFilter} charges` : "No charges registered"}
            </Text>
          </View>
        ) : (
          charges.map((c) => <ChargeCard key={c.id} charge={c} />)
        )}
      </View>
    </ScrollView>
  );
}
