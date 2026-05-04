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
import { markOverdue, getSummary, listCharges, listChargesForPeriod } from "../db/charges";
import { listContacts } from "../db/contacts";
import { formatColones, currentPeriod } from "../lib/format";
import type { Charge, ChargeStatus, Contact, Summary } from "../lib/types";
import { ChargeCard } from "./dashboard/ChargeCard";
import { ClientPickerModal } from "./dashboard/ClientPickerModal";
import { seedIfEmpty } from "./dashboard/seedIfEmpty";
import { LABELS } from "../constants/labels";

// ---------------------------------------------------------------------------
// StatusFilter — "active" means overdue + pending combined (default view)
// ---------------------------------------------------------------------------
type StatusFilter = ChargeStatus | "active" | "all";

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

function SummaryPanel({ summary, statusFilter, onStatusPress }: { summary: Summary; statusFilter: StatusFilter; onStatusPress: (s: StatusFilter) => void }) {
  return (
    <View className="px-4 pt-4 pb-2 gap-3">
      <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">{LABELS.dashboard.summaryTitle}</Text>
      <View className="flex-row gap-3">
        <StatCard label={LABELS.status.pending} count={summary.pendingCount} amount={summary.totalPending} bg="#3b82f6" active={statusFilter === "pending"} onPress={() => onStatusPress("pending")} />
        <StatCard label={LABELS.status.overdue} count={summary.overdueCount} amount={summary.totalOverdue} bg="#ef4444" active={statusFilter === "overdue"} onPress={() => onStatusPress("overdue")} />
      </View>
      <View className="flex-row gap-3">
        <StatCard label={LABELS.status.paid} count={summary.paidCount} amount={summary.totalPaid} bg="#16a34a" active={statusFilter === "paid"} onPress={() => onStatusPress("paid")} />
        <View className="flex-1 rounded-2xl p-4 bg-gray-100 dark:bg-gray-800 gap-1 justify-center">
          <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{LABELS.dashboard.totalReceivable}</Text>
          <Text className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {formatColones(summary.totalPending + summary.totalOverdue)}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
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
const SEGMENTS: { label: string; value: StatusFilter }[] = [
  { label: LABELS.dashboard.filterActive,  value: "active" },
  { label: LABELS.status.overdue,          value: "overdue" },
  { label: LABELS.status.pending,          value: "pending" },
  { label: LABELS.status.paid,             value: "paid" },
  { label: LABELS.dashboard.filterAll,     value: "all" },
];

const SEGMENT_ACTIVE_COLOR: Record<StatusFilter, string> = {
  active:  "bg-gray-800 dark:bg-gray-200",
  all:     "bg-gray-800 dark:bg-gray-200",
  pending: "bg-blue-600",
  overdue: "bg-red-600",
  paid:    "bg-green-600",
};

const SEGMENT_ACTIVE_TEXT: Record<StatusFilter, string> = {
  active:  "text-white dark:text-gray-900",
  all:     "text-white dark:text-gray-900",
  pending: "text-white",
  overdue: "text-white",
  paid:    "text-white",
};

function StatusSegmentedControl({
  active,
  onChange,
}: {
  active: StatusFilter;
  onChange: (v: StatusFilter) => void;
}) {
  return (
    <View className="mx-4 mt-3 mb-1 flex-row bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-0.5">
      {SEGMENTS.map((s) => {
        const selected = active === s.value;
        return (
          <Pressable
            key={s.value}
            onPress={() => onChange(s.value)}
            className={`flex-1 py-2 items-center rounded-lg active:opacity-70 ${selected ? SEGMENT_ACTIVE_COLOR[s.value] : ""}`}
          >
            <Text className={`text-xs font-semibold ${selected ? SEGMENT_ACTIVE_TEXT[s.value] : "text-gray-500 dark:text-gray-400"}`}>
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
function periodOffset(offset: number): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth() + 1 + offset;
  const date = new Date(y, m - 1, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

const PERIOD_CHIPS: { label: string; period: string }[] = [
  { label: LABELS.dashboard.rangePrevMonth, period: periodOffset(-1) },
  { label: LABELS.dashboard.rangeThisMonth, period: periodOffset(0) },
  { label: LABELS.dashboard.rangeNextMonth, period: periodOffset(1) },
];

function SecondaryFilterRow({
  contactFilter,
  selectedPeriod,
  selectedContact,
  onContactPress,
  onPeriodChange,
}: {
  contactFilter: string | null;
  selectedPeriod: string;
  selectedContact: Contact | null;
  onContactPress: () => void;
  onPeriodChange: (period: string) => void;
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
          contactFilter ? "bg-indigo-600 border-indigo-600" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
        } active:opacity-70`}
      >
        <Text className={`text-sm font-semibold ${contactFilter ? "text-white" : "text-gray-600 dark:text-gray-300"}`}>
          {selectedContact ? selectedContact.name : LABELS.dashboard.filterContact}
        </Text>
        <Text className={`text-xs ${contactFilter ? "text-white/70" : "text-gray-400 dark:text-gray-500"}`}>
          {contactFilter ? "✕" : "▾"}
        </Text>
      </Pressable>

      {/* Period chips */}
      {PERIOD_CHIPS.map((chip) => {
        const active = selectedPeriod === chip.period;
        return (
          <Pressable
            key={chip.period}
            onPress={() => onPeriodChange(chip.period)}
            className={`px-3.5 py-1.5 rounded-full border ${
              active ? "bg-gray-900 dark:bg-gray-100 border-gray-900 dark:border-gray-100" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            } active:opacity-70`}
          >
            <Text className={`text-sm font-semibold ${active ? "text-white dark:text-gray-900" : "text-gray-600 dark:text-gray-300"}`}>
              {chip.label}
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [contactFilter, setContactFilter] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(currentPeriod);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const selectedContact = contacts.find((c) => c.id === contactFilter) ?? null;

  const load = useCallback(() => {
    markOverdue();
    setSummary(getSummary());

    const thisPeriod = currentPeriod();
    // For the current period use listChargesForPeriod so unpaid past charges are included.
    // For other periods use listCharges scoped to that period.
    const all: Charge[] = selectedPeriod === thisPeriod
      ? listChargesForPeriod(selectedPeriod)
      : listCharges({ period: selectedPeriod });

    const filtered = all.filter((c) => {
      if (contactFilter && c.contact_id !== contactFilter) return false;
      if (statusFilter === "active") return c.status === "overdue" || c.status === "pending";
      if (statusFilter === "all") return true;
      return c.status === statusFilter;
    });

    setCharges(filtered);
  }, [statusFilter, contactFilter, selectedPeriod]);

  useEffect(() => {
    seedIfEmpty();
    setContacts(listContacts());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
    setRefreshing(false);
  }, [load]);

  const hasFilters = statusFilter !== "active" || contactFilter !== null || selectedPeriod !== currentPeriod();

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
          onStatusPress={(s) => setStatusFilter(statusFilter === s ? "active" : s)}
        />

        {/* Sticky filter area */}
        <View className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 pb-1">
          <StatusSegmentedControl active={statusFilter} onChange={setStatusFilter} />
          <SecondaryFilterRow
            contactFilter={contactFilter}
            selectedPeriod={selectedPeriod}
            selectedContact={selectedContact}
            onContactPress={() => contactFilter ? setContactFilter(null) : setShowContactPicker(true)}
            onPeriodChange={setSelectedPeriod}
          />
        </View>

        {/* Charge list */}
        <View className="pt-3 pb-24">
          {hasFilters && (
            <View className="px-4 pb-2 flex-row items-center justify-between">
              <Text className="text-xs text-gray-400 dark:text-gray-500">{charges.length} {charges.length !== 1 ? LABELS.charges.resultPlural : LABELS.charges.resultSingular}</Text>
              <Pressable
                onPress={() => {
                  setStatusFilter("active");
                  setContactFilter(null);
                  setSelectedPeriod(currentPeriod());
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
              <Text className="text-base font-medium text-gray-500 dark:text-gray-400">{LABELS.charges.emptyFiltered}</Text>
              <Text className="text-sm text-gray-400 dark:text-gray-500">
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
