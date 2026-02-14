import { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import { router } from "expo-router";
import { ChevronRight, Plus } from "lucide-react-native";
import { useEstimates } from "@/hooks/useEstimates";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterChips } from "@/components/common/FilterChips";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ESTIMATE_STATUS_COLORS } from "@/lib/colors";
import { ESTIMATE_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { EstimateStatus } from "@/types/models";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "approved", label: "Approved" },
];

export default function EstimateListScreen() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useEstimates({
    search: search || undefined,
    status: filter === "all" ? undefined : filter,
    pageSize: 50,
  });

  const estimates = data?.data ?? [];

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="px-4 pt-3 pb-2 gap-3">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search estimates..." />
        <FilterChips chips={FILTERS} activeKey={filter} onSelect={setFilter} />
      </View>

      <FlatList
        data={estimates}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => {
          const colors = ESTIMATE_STATUS_COLORS[item.status as EstimateStatus];
          return (
            <Pressable
              onPress={() => router.push(`/(tabs)/more/estimates/${item.id}`)}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-2 active:scale-[0.98]"
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {item.estimateNumber}
                </Text>
                <Badge
                  label={ESTIMATE_STATUS_LABELS[item.status as EstimateStatus]}
                  bgClass={colors.bg}
                  textClass={colors.text}
                />
              </View>
              <Text className="text-base font-medium text-slate-900 dark:text-white mb-1" numberOfLines={1}>
                {item.summary}
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-slate-500">
                  {formatDate(item.createdAt)}
                </Text>
                <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(item.totalAmount)}
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <View className="gap-2">
              {[1, 2, 3].map((i) => (
                <View key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 gap-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-16" />
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              title="No estimates"
              description="Create your first estimate on-site"
              actionLabel="New Estimate"
              onAction={() => router.push("/(tabs)/more/estimates/create")}
            />
          )
        }
      />

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/(tabs)/more/estimates/create")}
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg active:bg-blue-700"
      >
        <Plus size={24} color="#fff" />
      </Pressable>
    </View>
  );
}
