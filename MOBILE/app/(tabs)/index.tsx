import { View, Text, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { ClipboardList, Play, CheckCircle2 } from "lucide-react-native";
import { useJobs } from "@/hooks/useJobs";
import { useAuthStore } from "@/stores/auth";
import { JobCard } from "@/components/job/JobCard";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { QueryErrorState } from "@/components/common/QueryErrorState";
import { AnimatedListItem } from "@/components/ui/AnimatedListItem";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const today = useMemo(() => new Date(), []);
  const params = useMemo(
    () => ({
      from: startOfDay(today).toISOString(),
      to: endOfDay(today).toISOString(),
      status: "scheduled,dispatched,in_progress",
      sort: "scheduledStart",
      order: "asc" as const,
      pageSize: 50,
    }),
    [today]
  );

  const { data, isLoading, isError, refetch } = useJobs(params);
  const jobs = data?.data ?? [];

  const stats = useMemo(() => {
    const total = jobs.length;
    const inProgress = jobs.filter((j) => j.status === "in_progress").length;
    const completed = jobs.filter((j) => j.status === "completed").length;
    return { total, inProgress, completed };
  }, [jobs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View className="pt-2 pb-4">
            {/* Greeting */}
            <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {getGreeting()}, {user?.firstName || "Tech"}
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              {format(today, "EEEE, MMMM d")}
            </Text>

            {/* Stats */}
            <View className="flex-row gap-3 mb-5">
              <Animated.View className="flex-1" entering={FadeInDown.delay(0).duration(400).springify()}>
                <StatCard
                  icon={<ClipboardList size={20} color="#3b82f6" />}
                  label="Today's Jobs"
                  value={stats.total}
                  bgClass="bg-blue-50 dark:bg-blue-950"
                />
              </Animated.View>
              <Animated.View className="flex-1" entering={FadeInDown.delay(80).duration(400).springify()}>
                <StatCard
                  icon={<Play size={20} color="#f59e0b" />}
                  label="In Progress"
                  value={stats.inProgress}
                  bgClass="bg-amber-50 dark:bg-amber-950"
                />
              </Animated.View>
              <Animated.View className="flex-1" entering={FadeInDown.delay(160).duration(400).springify()}>
                <StatCard
                  icon={<CheckCircle2 size={20} color="#10b981" />}
                  label="Completed"
                  value={stats.completed}
                  bgClass="bg-emerald-50 dark:bg-emerald-950"
                />
              </Animated.View>
            </View>

            {/* Section header */}
            <Text className="text-lg font-semibold text-slate-900 dark:text-white">
              Today's Schedule
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <View className="mb-3">
              <JobCard
                job={item}
                onPress={() => router.push(`/(tabs)/jobs/${item.id}`)}
              />
            </View>
          </AnimatedListItem>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View className="gap-3">
              {[1, 2, 3].map((i) => (
                <View key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 gap-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-24" />
                </View>
              ))}
            </View>
          ) : isError ? (
            <QueryErrorState onRetry={() => refetch()} />
          ) : (
            <EmptyState
              title="No jobs today"
              description="You have no scheduled jobs for today. Enjoy your day!"
            />
          )
        }
      />
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
  bgClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bgClass: string;
}) {
  return (
    <View className={`rounded-2xl p-3 ${bgClass}`}>
      <View className="mb-2">{icon}</View>
      <Text className="text-2xl font-bold text-slate-900 dark:text-white">
        {value}
      </Text>
      <Text className="text-xs text-slate-500 dark:text-slate-400">{label}</Text>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
