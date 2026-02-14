import { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Phone, ChevronRight } from "lucide-react-native";
import { useCustomers } from "@/hooks/useCustomers";
import { SearchBar } from "@/components/common/SearchBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import { getInitials, formatPhone } from "@/lib/format";

export default function CustomerListScreen() {
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useCustomers({
    search: search || undefined,
    pageSize: 50,
  });

  const customers = data?.data ?? [];

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="px-4 pt-3 pb-2">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search customers..."
        />
      </View>

      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(tabs)/more/customers/${item.id}`)}
            className="flex-row items-center gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-2 active:scale-[0.98]"
          >
            <Avatar
              initials={getInitials(item.firstName, item.lastName)}
              size="md"
            />
            <View className="flex-1">
              <Text className="text-base font-medium text-slate-900 dark:text-white">
                {item.firstName} {item.lastName}
              </Text>
              {item.companyName && (
                <Text className="text-xs text-slate-500">{item.companyName}</Text>
              )}
              <View className="flex-row items-center gap-1 mt-0.5">
                <Phone size={11} color="#94a3b8" />
                <Text className="text-xs text-slate-500">
                  {formatPhone(item.phone)}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94a3b8" />
          </Pressable>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View className="gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex-row gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <View className="flex-1 gap-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              title="No customers found"
              description={search ? "Try a different search term" : "No customers yet"}
            />
          )
        }
      />
    </View>
  );
}
