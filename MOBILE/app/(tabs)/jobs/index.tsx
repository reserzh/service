import { useState, useMemo, useCallback } from "react";
import { View, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useJobs } from "@/hooks/useJobs";
import { JobCard } from "@/components/job/JobCard";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterChips } from "@/components/common/FilterChips";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

const FILTERS = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
];

const STATUS_MAP: Record<string, string | undefined> = {
  active: "new,scheduled,dispatched,in_progress",
  completed: "completed",
  all: undefined,
};

export default function JobListScreen() {
  const [filter, setFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const params = useMemo(
    () => ({
      status: STATUS_MAP[filter],
      search: search || undefined,
      sort: "scheduledStart",
      order: "desc" as const,
      pageSize: 50,
    }),
    [filter, search]
  );

  const { data, isLoading, refetch } = useJobs(params);
  const jobs = data?.data ?? [];

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      {/* Header */}
      <View className="px-4 pt-2 pb-3 gap-3">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search jobs..."
        />
        <FilterChips chips={FILTERS} activeKey={filter} onSelect={setFilter} />
      </View>

      {/* Job list */}
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => (
          <View className="mb-3">
            <JobCard
              job={item}
              onPress={() => router.push(`/(tabs)/jobs/${item.id}`)}
            />
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View className="gap-3">
              {[1, 2, 3, 4].map((i) => (
                <View key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 gap-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-24" />
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              title="No jobs found"
              description={search ? "Try a different search term" : "No jobs match the current filter"}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
