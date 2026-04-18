import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { formatColones, formatDate } from "../../lib/format";
import type { Charge, ChargeStatus } from "../../lib/types";

const STATUS_STYLE: Record<ChargeStatus, { badge: string; text: string; label: string }> = {
  pending: { badge: "bg-blue-100", text: "text-blue-700", label: "Pendiente" },
  overdue: { badge: "bg-red-100",  text: "text-red-700",  label: "Vencido" },
  paid:    { badge: "bg-green-100", text: "text-green-700", label: "Pagado" },
};

export function ChargeCard({ charge }: { charge: Charge }) {
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
