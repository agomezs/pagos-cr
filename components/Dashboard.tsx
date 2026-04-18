import React, { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { markOverdue, getSummary, listCharges, createCharge } from "../db/charges";
import { createClient, listClients } from "../db/clients";
import { getDb } from "../db/database";
import { formatColones, formatDate } from "../lib/format";
import type { Charge, ChargeStatus, Client, Summary } from "../lib/types";

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
      <Text className="text-xs text-white/70">{count} cobro{count !== 1 ? "s" : ""}</Text>
    </View>
  );
}

function SummaryPanel({ summary }: { summary: Summary }) {
  return (
    <View className="px-4 pt-4 pb-2 gap-3">
      <Text className="text-xl font-bold text-gray-900">Resumen</Text>
      <View className="flex-row gap-3">
        <StatCard label="Pendiente" count={summary.pendingCount} amount={summary.totalPending} color="bg-blue-500" />
        <StatCard label="Vencido" count={summary.overdueCount} amount={summary.totalOverdue} color="bg-red-500" />
      </View>
      <View className="flex-row gap-3">
        <StatCard label="Pagado" count={summary.paidCount} amount={summary.totalPaid} color="bg-green-600" />
        <View className="flex-1 rounded-2xl p-4 bg-gray-100 gap-1 justify-center">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Por cobrar</Text>
          <Text className="text-2xl font-bold text-gray-800">
            {formatColones(summary.totalPending + summary.totalOverdue)}
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
  { label: "Todos",     value: null },
  { label: "Pendiente", value: "pending" },
  { label: "Vencido",   value: "overdue" },
  { label: "Pagado",    value: "paid" },
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
// ClientPicker modal
// ---------------------------------------------------------------------------
function ClientPickerModal({
  visible,
  clients,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  clients: Client[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-gray-50">
        <View className="px-4 pt-6 pb-3 flex-row items-center justify-between border-b border-gray-100 bg-white">
          <Text className="text-lg font-bold text-gray-900">Filtrar por cliente</Text>
          <Pressable onPress={onClose} className="active:opacity-70">
            <Text className="text-blue-600 font-semibold text-base">Listo</Text>
          </Pressable>
        </View>
        <View className="px-4 py-3 bg-white border-b border-gray-100">
          <TextInput
            className="bg-gray-100 rounded-xl px-4 py-2.5 text-base text-gray-900"
            placeholder="Buscar cliente…"
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
        <ScrollView>
          <Pressable
            onPress={() => { onSelect(null); onClose(); }}
            className="px-4 py-4 bg-white border-b border-gray-100 active:opacity-70"
          >
            <Text className={`text-base ${selected === null ? "text-blue-600 font-semibold" : "text-gray-800"}`}>
              Todos los clientes
            </Text>
          </Pressable>
          {filtered.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => { onSelect(c.id); onClose(); }}
              className="px-4 py-4 bg-white border-b border-gray-100 active:opacity-70"
            >
              <Text className={`text-base ${selected === c.id ? "text-blue-600 font-semibold" : "text-gray-800"}`}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
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
    { label: "Mes ant.",  from: toISO(new Date(y, mo - 1, 1)), to: toISO(new Date(y, mo, 0)) },
    { label: "Este mes",  from: toISO(new Date(y, mo, 1)),     to: toISO(new Date(y, mo + 1, 0)) },
    { label: "Próx. mes", from: toISO(new Date(y, mo + 1, 1)), to: toISO(new Date(y, mo + 2, 0)) },
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
          {selectedClient ? selectedClient.name : "Cliente"}
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
// ChargeCard
// ---------------------------------------------------------------------------
const STATUS_STYLE: Record<ChargeStatus, { badge: string; text: string; label: string }> = {
  pending: { badge: "bg-blue-100", text: "text-blue-700", label: "Pendiente" },
  overdue: { badge: "bg-red-100",  text: "text-red-700",  label: "Vencido" },
  paid:    { badge: "bg-green-100", text: "text-green-700", label: "Pagado" },
};

function ChargeCard({ charge }: { charge: Charge }) {
  const router = useRouter();
  const style = STATUS_STYLE[charge.status];
  const canPay = charge.status === "pending" || charge.status === "overdue";

  function handlePress() {
    if (canPay) {
      router.push({
        pathname: "/charges/[id]/pay",
        params: {
          id: charge.id,
          concept: charge.concept,
          amount: String(charge.amount),
          client_name: charge.client_name ?? "",
        },
      });
    } else {
      router.push(`/clients/${charge.client_id}`);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      className="mx-4 mb-3 bg-white rounded-2xl p-4 border border-gray-100 active:opacity-70"
    >
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
              ? `Pagado el ${formatDate(charge.paid_at)}`
              : `Vence ${formatDate(charge.due_date)}`}
          </Text>
          {charge.payment_method && (
            <Text className="text-xs text-gray-400 capitalize">{charge.payment_method.toUpperCase()}</Text>
          )}
        </View>
        <View className="flex-row items-center gap-1.5">
          <Text className="text-lg font-bold text-gray-900">{formatColones(charge.amount)}</Text>
          {canPay && <Text className="text-gray-300 text-base">›</Text>}
        </View>
      </View>
    </Pressable>
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
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
        <SummaryPanel summary={summary} />

        {/* Sticky filter area */}
        <View className="bg-gray-50 border-b border-gray-100 pb-1">
          <StatusSegmentedControl active={statusFilter} onChange={setStatusFilter} />
          <SecondaryFilterRow
            clientFilter={clientFilter}
            dateFrom={dateFrom}
            dateTo={dateTo}
            selectedClient={selectedClient}
            onClientPress={() => setShowClientPicker(true)}
            onDateRange={(from, to) => { setDateFrom(from); setDateTo(to); }}
          />
        </View>

        {/* Charge list */}
        <View className="pt-3 pb-24">
          {hasFilters && (
            <View className="px-4 pb-2 flex-row items-center justify-between">
              <Text className="text-xs text-gray-400">{charges.length} resultado{charges.length !== 1 ? "s" : ""}</Text>
              <Pressable
                onPress={() => {
                  setStatusFilter(null);
                  setClientFilter(null);
                  setDateFrom(null);
                  setDateTo(null);
                }}
                className="active:opacity-70"
              >
                <Text className="text-xs text-blue-500 font-semibold">Quitar filtros</Text>
              </Pressable>
            </View>
          )}

          {charges.length === 0 ? (
            <View className="items-center py-16 gap-2">
              <Text className="text-4xl">📋</Text>
              <Text className="text-base font-medium text-gray-500">Sin cobros</Text>
              <Text className="text-sm text-gray-400">
                {hasFilters ? "Ningún cobro coincide con los filtros" : "Aún no hay cobros registrados"}
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
