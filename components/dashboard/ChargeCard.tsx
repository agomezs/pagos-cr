import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { formatColones, formatDate } from "../../lib/format";
import type { Charge, ChargeStatus } from "../../lib/types";
import { LABELS } from "../../constants/labels";

const STATUS_STYLE: Record<ChargeStatus, { badge: string; text: string; label: string }> = {
  pending: { badge: "bg-blue-100 dark:bg-blue-900/40",  text: "text-blue-700 dark:text-blue-400",  label: LABELS.status.pending },
  overdue: { badge: "bg-red-100 dark:bg-red-900/40",   text: "text-red-700 dark:text-red-400",   label: LABELS.status.overdue },
  paid:    { badge: "bg-green-100 dark:bg-green-900/40", text: "text-green-700 dark:text-green-400", label: LABELS.status.paid },
};

export function ChargeCard({ charge }: { charge: Charge }) {
  const router = useRouter();
  const style = STATUS_STYLE[charge.status];
  const lines = charge.lines ?? [];
  const unpaidTotal = lines.filter((l) => l.status !== "paid").reduce((s, l) => s + l.amount, 0);
  const displayAmount = charge.status === "paid"
    ? lines.reduce((s, l) => s + l.amount, 0)
    : unpaidTotal;

  const firstLineConcept = lines[0]?.concept ?? "";
  const extraCount = lines.length - 1;

  const paidLine = charge.status === "paid"
    ? lines.find((l) => l.paid_at)
    : null;

  function handlePress() {
    router.push(`/contacts/${charge.contact_id}`);
  }

  return (
    <Pressable
      onPress={handlePress}
      className={`mx-4 mb-3 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 active:opacity-70 ${charge.status === "overdue" ? "border-l-4 border-l-red-400" : ""}`}
    >
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1 gap-0.5">
          <Text className="text-base font-semibold text-gray-900 dark:text-gray-100" numberOfLines={1}>
            {charge.contact_name}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400" numberOfLines={1}>
            {firstLineConcept}{extraCount > 0 ? ` +${extraCount}` : ""}
          </Text>
        </View>
        <View className={`px-2.5 py-1 rounded-full ${style.badge}`}>
          <Text className={`text-xs font-semibold ${style.text}`}>{style.label}</Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-end justify-between">
        <View className="gap-0.5">
          <Text className="text-xs text-gray-400 dark:text-gray-500">
            {paidLine?.paid_at
              ? `${LABELS.charges.paidPrefix} ${formatDate(paidLine.paid_at)}`
              : `${LABELS.charges.duePrefixShort} ${formatDate(charge.due_date)}`}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatColones(displayAmount)}</Text>
          <Text className="text-gray-300 text-base">›</Text>
        </View>
      </View>
    </Pressable>
  );
}
