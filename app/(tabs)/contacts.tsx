import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { listContacts } from "../../db/contacts";
import type { Contact } from "../../lib/types";
import { LABELS } from "../../constants/labels";

function ContactRow({ contact, onPress }: { contact: Contact; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="mx-4 mb-3 bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 border border-gray-100 dark:border-gray-700 shadow-sm gap-0.5 active:opacity-70"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">{contact.name}</Text>
        <Text className="text-gray-300 text-lg">›</Text>
      </View>
      {contact.phone ? (
        <Text className="text-sm text-gray-500 dark:text-gray-400">{contact.phone}</Text>
      ) : null}
      {contact.notes ? (
        <Text className="text-sm text-gray-400 dark:text-gray-500" numberOfLines={1}>{contact.notes}</Text>
      ) : null}
    </Pressable>
  );
}

export default function ContactsScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setContacts(listContacts());
  }, []);

  useFocusEffect(load);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="px-4 pb-3">
        <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">{LABELS.contacts.screenTitle}</Text>
      </View>

      <FlatList
        className="flex-1"
        data={contacts}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <ContactRow contact={item} onPress={() => router.push(`/contacts/${item.id}`)} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="items-center py-16 gap-2">
            <Text className="text-4xl">👤</Text>
            <Text className="text-base font-medium text-gray-500">{LABELS.contacts.emptyTitle}</Text>
            <Text className="text-sm text-gray-400 dark:text-gray-500">{LABELS.contacts.emptyHint}</Text>
          </View>
        }
        contentContainerClassName="pt-2 pb-24"
      />

      <Pressable
        onPress={() => router.push("/contacts/new")}
        className="absolute bottom-8 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Text className="text-white text-3xl font-light leading-none">+</Text>
      </Pressable>
    </SafeAreaView>
  );
}
