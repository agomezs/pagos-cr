import React, { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { markOverdue, getSummary, listCharges , createCharge } from "../db/charges";
import { listContacts, createContact } from "../db/contacts";
import { createLine } from "../db/chargeLines";
import { createTemplate } from "../db/chargeTemplates";
import { getDb } from "../db/database";
import { formatColones } from "../lib/format";
import type { Charge, ChargeStatus, Contact, Summary } from "../lib/types";
import { ChargeCard } from "./dashboard/ChargeCard";
import { ClientPickerModal } from "./dashboard/ClientPickerModal";
import { LABELS } from "../constants/labels";

// ---------------------------------------------------------------------------
// Seed helper — inserts demo data on first run
// ---------------------------------------------------------------------------
function seedIfEmpty() {
  const contacts = listContacts();
  if (contacts.length > 0) return;

  const c1 = { id: "c1", name: "Ana Rodríguez", phone: "88001234", notes: null };
  const c2 = { id: "c2", name: "Luis Pérez", phone: "88005678", notes: null };
  const c3 = { id: "c3", name: "María Castro", phone: null, notes: null };
  createContact(c1);
  createContact(c2);
  createContact(c3);

  createTemplate({ id: "t1", concept: "Mensualidad", amount: 210000, type: "recurring" });
  createTemplate({ id: "t2", concept: "Ballet", amount: 25000, type: "extra" });
  createTemplate({ id: "t3", concept: "Guardería", amount: 40000, type: "recurring" });

  // May charge: Ana — tuition + ballet
  createCharge({ id: "ch1", contact_id: "c1", due_date: "2026-05-02" });
  createLine({ id: "l1", charge_id: "ch1", concept: "Mensualidad mayo", amount: 380000, description: "Lucas + Clarita", type: "recurring" });
  createLine({ id: "l2", charge_id: "ch1", concept: "Ballet", amount: 25000, description: "Clarita", type: "extra" });

  // May charge: Luis — tuition
  createCharge({ id: "ch2", contact_id: "c2", due_date: "2026-05-02" });
  createLine({ id: "l3", charge_id: "ch2", concept: "Mensualidad mayo", amount: 210000, description: null, type: "recurring" });

  // May charge: María — tuition + daycare
  createCharge({ id: "ch3", contact_id: "c3", due_date: "2026-05-15" });
  createLine({ id: "l4", charge_id: "ch3", concept: "Mensualidad mayo", amount: 210000, description: null, type: "recurring" });
  createLine({ id: "l5", charge_id: "ch3", concept: "Guardería mayo", amount: 40000, description: null, type: "recurring" });

  // April charge: Ana — past due
  createCharge({ id: "ch4", contact_id: "c1", due_date: "2026-04-02" });
  createLine({ id: "l6", charge_id: "ch4", concept: "Mensualidad abril", amount: 380000, description: "Lucas + Clarita", type: "recurring" });

  // April charge: Luis — already paid
  createCharge({ id: "ch5", contact_id: "c2", due_date: "2026-04-02" });
  createLine({ id: "l7", charge_id: "ch5", concept: "Mensualidad abril", amount: 210000, description: null, type: "recurring" });

  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE charge_lines SET status='paid', payment_method='sinpe', paid_at='2026-04-03', updated_at=? WHERE id='l7'`,
    now,
  );
  db.runSync(
    `UPDATE charges SET status='paid', updated_at=? WHERE id='ch5'`,
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
      style={[styles.statCard, { backgroundColor: bg }, active ? styles.statCardActive : null]}
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
// SecondaryFilterRow
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
  contactFilter,
  dateFrom,
  dateTo,
  selectedContact,
  onContactPress,
  onDateRange,
}: {
  contactFilter: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  selectedContact: Contact | null;
  onContactPress: () => void;
  onDateRange: (from: string | null, to: string | null) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-4 py-2 gap-2 items-center"
    >
      {/* Contact chip */}
      <Pressable
        onPress={onContactPress}
        className={`flex-row items-center gap-1 px-3.5 py-1.5 rounded-full border ${
          contactFilter ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-300"
        } active:opacity-70`}
      >
        <Text className={`text-sm font-semibold ${contactFilter ? "text-white" : "text-gray-600"}`}>
          {selectedContact ? selectedContact.name : LABELS.dashboard.filterContact}
        </Text>
        <Text className={`text-xs ${contactFilter ? "text-white/70" : "text-gray-400"}`}>
          {contactFilter ? "✕" : "▾"}
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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [statusFilter, setStatusFilter] = useState<ChargeStatus | null>(null);
  const [contactFilter, setContactFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const selectedContact = contacts.find((c) => c.id === contactFilter) ?? null;

  const load = useCallback(() => {
    markOverdue();
    setSummary(getSummary());
    setCharges(listCharges({ status: statusFilter, contact_id: contactFilter, date_from: dateFrom, date_to: dateTo }));
  }, [statusFilter, contactFilter, dateFrom, dateTo]);

  useEffect(() => {
    seedIfEmpty();
    setContacts(listContacts());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const hasFilters = statusFilter !== null || contactFilter !== null || dateFrom !== null || dateTo !== null;

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
            contactFilter={contactFilter}
            dateFrom={dateFrom}
            dateTo={dateTo}
            selectedContact={selectedContact}
            onContactPress={() => contactFilter ? setContactFilter(null) : setShowContactPicker(true)}
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
                  setContactFilter(null);
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
        visible={showContactPicker}
        clients={contacts}
        selected={contactFilter}
        onSelect={(id) => {
          setContactFilter(contactFilter === id ? null : id);
        }}
        onClose={() => setShowContactPicker(false)}
      />
    </View>
  );
}

const STAT_CARD_BORDER_COLOR = "rgba(255,255,255,0.6)";

const styles = StyleSheet.create({
  statCard: { flex: 1, borderRadius: 16, padding: 16, gap: 4, borderColor: STAT_CARD_BORDER_COLOR },
  statCardActive: { borderWidth: 2 },
});
