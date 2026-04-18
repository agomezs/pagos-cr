import React, { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { markOverdue, getSummary, listCharges, createCharge } from "../db/charges";
import { createClient, listClients } from "../db/clients";
import { getDb } from "../db/database";
import { formatColones } from "../lib/format";
import type { Charge, ChargeStatus, Client, Summary } from "../lib/types";
import { ChargeCard } from "./dashboard/ChargeCard";
import { ClientPickerModal } from "./dashboard/ClientPickerModal";
import { LABELS } from "../constants/labels";

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
type StatCardProps = { label: string; count: number; amount: number; bg: string; active?: boolean; onPress?: () => void };

function StatCard({ label, count, amount, bg, active, onPress }: StatCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, borderRadius: 16, padding: 16, gap: 4, backgroundColor: bg, borderWidth: active ? 2 : 0, borderColor: "rgba(255,255,255,0.6)" }}
    >
      <Text className="text-xs font-semibold text-white/80 uppercase tracking-wide">{label}</Text>
      <Text className="text-2xl font-bold text-white">{formatColones(amount)}</Text>
      <Text className="text-xs text-white/70">{count} {count !== 1 ? LABELS.charges.chargePlural : LABELS.charges.chargeSingular}</Text>
    </Pressable>
  );
}

function SummaryPanel({ summary, statusFilter, onStatusPress }: { summary: Summary; statusFilter: ChargeStatus | null; onStatusPress: (s: ChargeStatus) => void }) {
  return (
    <View className="px-4 pt-4 pb-2 gap-3">
      <Text className="text-xl font-bold text-gray-900">{LABELS.dashboard.summaryTitle}</Text>
      <View className="flex-row gap-3">
        <StatCard label={LABELS.status.pending} count={summary.pendingCount} amount={summary.totalPending} bg="#3b82f6" active={statusFilter === "pending"} onPress={() => onStatusPress("pending")} />
        <StatCard label={LABELS.status.overdue} count={summary.overdueCount} amount={summary.totalOverdue} bg="#ef4444" active={statusFilter === "overdue"} onPress={() => onStatusPress("overdue")} />
      </View>
      <View className="flex-row gap-3">
        <StatCard label={LABELS.status.paid} count={summary.paidCount} amount={summary.totalPaid} bg="#16a34a" active={statusFilter === "paid"} onPress={() => onStatusPress("paid")} />
        <View className="flex-1 rounded-2xl p-4 bg-gray-100 gap-1 justify-center">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{LABELS.dashboard.totalReceivable}</Text>
          <Text className="text-2xl font-bold text-gray-800">
            {formatColones(summary.totalPending + summary.totalOverdue)}
          </Text>
          <Text className="text-xs text-gray-500">
            {summary.pendingCount + summary.overdueCount} {(summary.pendingCount + summary.overdueCount) !== 1 ? LABELS.charges.chargePlural : LABELS.charges.chargeSingular}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// StatusSegmentedControl
// ---------------------------------------------------------------------------
const SEGMENTS: { label: string; value: ChargeStatus | null }[] = [
  { label: LABELS.dashboard.filterAll,   value: null },
  { label: LABELS.status.pending,        value: "pending" },
  { label: LABELS.status.overdue,        value: "overdue" },
  { label: LABELS.status.paid,           value: "paid" },
];

const SEGMENT_ACTIVE_COLOR: Record<string, string> = {
  "null":    "bg-gray-800",
  "pending": "bg-blue-600",
  "overdue": "bg-red-600",
  "paid":    "bg-green-600",
};

function StatusSegmentedControl({
  active,
  onChange,
}: {
  active: ChargeStatus | null;
  onChange: (v: ChargeStatus | null) => void;
}) {
  return (
    <View className="mx-4 mt-3 mb-1 flex-row bg-gray-100 rounded-xl p-1 gap-0.5">
      {SEGMENTS.map((s) => {
        const selected = active === s.value;
        return (
          <Pressable
            key={String(s.value)}
            onPress={() => onChange(s.value)}
            className={`flex-1 py-2 items-center rounded-lg active:opacity-70 ${selected ? (SEGMENT_ACTIVE_COLOR[String(s.value)] ?? "bg-gray-800") : ""}`}
          >
            <Text className={`text-xs font-semibold ${selected ? "text-white" : "text-gray-500"}`}>
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// SecondaryFilterRow — client chip + date range chips
// ---------------------------------------------------------------------------
function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const QUICK_RANGES: { label: string; from: string; to: string }[] = (() => {
  const today = new Date();
  const y = today.getFullYear();
  const mo = today.getMonth();
  return [
    { label: LABELS.dashboard.rangePrevMonth, from: toISO(new Date(y, mo - 1, 1)), to: toISO(new Date(y, mo, 0)) },
    { label: LABELS.dashboard.rangeThisMonth, from: toISO(new Date(y, mo, 1)),     to: toISO(new Date(y, mo + 1, 0)) },
    { label: LABELS.dashboard.rangeNextMonth, from: toISO(new Date(y, mo + 1, 1)), to: toISO(new Date(y, mo + 2, 0)) },
  ];
})();

function SecondaryFilterRow({
  clientFilter,
  dateFrom,
  dateTo,
  selectedClient,
  onClientPress,
  onDateRange,
}: {
  clientFilter: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  selectedClient: Client | null;
  onClientPress: () => void;
  onDateRange: (from: string | null, to: string | null) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-4 py-2 gap-2 items-center"
    >
      {/* Client chip */}
      <Pressable
        onPress={onClientPress}
        className={`flex-row items-center gap-1 px-3.5 py-1.5 rounded-full border ${
          clientFilter ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-300"
        } active:opacity-70`}
      >
        <Text className={`text-sm font-semibold ${clientFilter ? "text-white" : "text-gray-600"}`}>
          {selectedClient ? selectedClient.name : LABELS.dashboard.filterClient}
        </Text>
        <Text className={`text-xs ${clientFilter ? "text-white/70" : "text-gray-400"}`}>
          {clientFilter ? "✕" : "▾"}
        </Text>
      </Pressable>

      {/* Date range chips */}
      {QUICK_RANGES.map((r) => {
        const active = dateFrom === r.from && dateTo === r.to;
        return (
          <Pressable
            key={r.label}
            onPress={() => onDateRange(active ? null : r.from, active ? null : r.to)}
            className={`px-3.5 py-1.5 rounded-full border ${
              active ? "bg-gray-900 border-gray-900" : "bg-white border-gray-300"
            } active:opacity-70`}
          >
            <Text className={`text-sm font-semibold ${active ? "text-white" : "text-gray-600"}`}>
              {r.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
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
  const [clients, setClients] = useState<Client[]>([]);
  const [statusFilter, setStatusFilter] = useState<ChargeStatus | null>(null);
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const selectedClient = clients.find((c) => c.id === clientFilter) ?? null;

  const load = useCallback(() => {
    markOverdue();
    setSummary(getSummary());
    setCharges(listCharges({ status: statusFilter, client_id: clientFilter, date_from: dateFrom, date_to: dateTo }));
  }, [statusFilter, clientFilter, dateFrom, dateTo]);

  useEffect(() => {
    seedIfEmpty();
    setClients(listClients());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const hasFilters = statusFilter !== null || clientFilter !== null || dateFrom !== null || dateTo !== null;

  return (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        stickyHeaderIndices={[1]}
      >
        <SummaryPanel
          summary={summary}
          statusFilter={statusFilter}
          onStatusPress={(s) => setStatusFilter(statusFilter === s ? null : s)}
        />

        {/* Sticky filter area */}
        <View className="bg-gray-50 border-b border-gray-100 pb-1">
          <StatusSegmentedControl active={statusFilter} onChange={setStatusFilter} />
          <SecondaryFilterRow
            clientFilter={clientFilter}
            dateFrom={dateFrom}
            dateTo={dateTo}
            selectedClient={selectedClient}
            onClientPress={() => clientFilter ? setClientFilter(null) : setShowClientPicker(true)}
            onDateRange={(from, to) => { setDateFrom(from); setDateTo(to); }}
          />
        </View>

        {/* Charge list */}
        <View className="pt-3 pb-24">
          {hasFilters && (
            <View className="px-4 pb-2 flex-row items-center justify-between">
              <Text className="text-xs text-gray-400">{charges.length} {charges.length !== 1 ? LABELS.charges.resultPlural : LABELS.charges.resultSingular}</Text>
              <Pressable
                onPress={() => {
                  setStatusFilter(null);
                  setClientFilter(null);
                  setDateFrom(null);
                  setDateTo(null);
                }}
                className="active:opacity-70"
              >
                <Text className="text-xs text-blue-500 font-semibold">{LABELS.charges.clearFilters}</Text>
              </Pressable>
            </View>
          )}

          {charges.length === 0 ? (
            <View className="items-center py-16 gap-2">
              <Text className="text-4xl">📋</Text>
              <Text className="text-base font-medium text-gray-500">{LABELS.charges.emptyFiltered}</Text>
              <Text className="text-sm text-gray-400">
                {hasFilters ? LABELS.charges.emptyFilteredMessage : LABELS.charges.emptyInitialMessage}
              </Text>
            </View>
          ) : (
            charges.map((c) => <ChargeCard key={c.id} charge={c} />)
          )}
        </View>
      </ScrollView>

      <ClientPickerModal
        visible={showClientPicker}
        clients={clients}
        selected={clientFilter}
        onSelect={(id) => {
          if (clientFilter === id) {
            setClientFilter(null);
          } else {
            setClientFilter(id);
          }
        }}
        onClose={() => setShowClientPicker(false)}
      />
    </View>
  );
}
