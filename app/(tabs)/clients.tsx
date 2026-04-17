import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { listClients } from "../../db/clients";
import type { Client } from "../../lib/types";

function ClientRow({ client, onPress }: { client: Client; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="mx-4 mb-3 bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm gap-0.5 active:opacity-70"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-gray-900">{client.name}</Text>
        <Text className="text-gray-300 text-lg">›</Text>
      </View>
      {client.phone ? (
        <Text className="text-sm text-gray-500">{client.phone}</Text>
      ) : null}
      {client.notes ? (
        <Text className="text-sm text-gray-400" numberOfLines={1}>{client.notes}</Text>
      ) : null}
    </Pressable>
  );
}

export default function ClientsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setClients(listClients());
  }, []);

  // Reload every time this tab comes into focus (e.g. after adding a client)
  useFocusEffect(load);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
    setRefreshing(false);
  }, [load]);

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 pb-3" style={{ paddingTop: insets.top + 16 }}>
        <Text className="text-xl font-bold text-gray-900">Clientes</Text>
      </View>

      <FlatList
        className="flex-1"
        data={clients}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <ClientRow client={item} onPress={() => router.push(`/clients/${item.id}`)} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="items-center py-16 gap-2">
            <Text className="text-4xl">👤</Text>
            <Text className="text-base font-medium text-gray-500">Sin clientes</Text>
            <Text className="text-sm text-gray-400">Usa el botón + para agregar uno</Text>
          </View>
        }
        contentContainerClassName="pt-2 pb-24"
      />

      <Pressable
        onPress={() => router.push("/clients/new")}
        className="absolute bottom-8 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Text className="text-white text-3xl font-light leading-none">+</Text>
      </Pressable>
    </View>
  );
}
