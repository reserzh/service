import { View, Text, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ClipboardList, CheckCircle2, MapPin } from "lucide-react-native";
import { useJobStats } from "@/hooks/useJobStats";
import { useAuthStore } from "@/stores/auth";
import { useTimeTrackingStore } from "@/stores/timeTracking";
import { JobCard } from "@/components/job/JobCard";
import { NextJobCard } from "@/components/home/NextJobCard";
import { QuickActions } from "@/components/home/QuickActions";
import { ClockWidget } from "@/components/home/ClockWidget";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { QueryErrorState } from "@/components/common/QueryErrorState";
import { AnimatedListItem } from "@/components/ui/AnimatedListItem";
import { setupJobGeofences } from "@/lib/geofencing";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const { stats, jobs, isLoading, isError, refetch } = useJobStats();
  const restoreTimeTracking = useTimeTrackingStore((s) => s.restore);

  useEffect(() => {
    restoreTimeTracking();
  }, [restoreTimeTracking]);

  // Phase 8: Set up geofences when schedule loads
  useEffect(() => {
    if (jobs.length > 0) {
      const jobsForGeofence = jobs as Array<typeof jobs[number] & {
        customerFirstName?: string;
        customerLastName?: string;
        propertyLatitude?: string | null;
        propertyLongitude?: string | null;
      }>;
      setupJobGeofences(
        jobsForGeofence.map((j) => ({
          id: j.id,
          summary: j.summary,
          customerFirstName: j.customerFirstName,
          customerLastName: j.customerLastName,
          propertyLatitude: j.propertyLatitude,
          propertyLongitude: j.propertyLongitude,
        }))
      );
    }
  }, [jobs]);

  const today = useMemo(() => new Date(), []);

  const nextJob = useMemo(() => {
    const now = new Date();
    return (
      jobs.find(
        (j) =>
          (j.status === "scheduled" || j.status === "dispatched") &&
          j.scheduledStart &&
          new Date(j.scheduledStart) >= now
      ) ??
      jobs.find(
        (j) => j.status === "in_progress"
      ) ??
      null
    );
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
            <Text className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {getGreeting()}, {user?.firstName || "Tech"}
            </Text>
            <Text className="text-base text-slate-500 dark:text-slate-400 mb-5">
              {format(today, "EEEE, MMMM d")}
            </Text>

            {/* Clock Widget */}
            <View className="mb-5">
              <ClockWidget />
            </View>

            {/* Quick Actions */}
            <View className="mb-5">
              <QuickActions />
            </View>

            {/* Stats */}
            <View className="flex-row gap-3 mb-5">
              <Animated.View className="flex-1" entering={FadeInDown.delay(0).duration(400).springify()}>
                <StatCard
                  icon={<ClipboardList size={24} color="#3b82f6" />}
                  label="Today's Jobs"
                  value={String(stats.total)}
                  bgClass="bg-blue-50 dark:bg-blue-950"
                />
              </Animated.View>
              <Animated.View className="flex-1" entering={FadeInDown.delay(80).duration(400).springify()}>
                <StatCard
                  icon={<CheckCircle2 size={24} color="#10b981" />}
                  label="Completed"
                  value={String(stats.completed)}
                  bgClass="bg-emerald-50 dark:bg-emerald-950"
                />
              </Animated.View>
            </View>

            {/* Next Job Card */}
            {nextJob && (
              <View className="mb-5">
                <NextJobCard job={nextJob} />
              </View>
            )}

            {/* Section header — Route Sheet */}
            <View className="flex-row items-center gap-2">
              <MapPin size={18} color="#64748b" />
              <Text className="text-xl font-semibold text-slate-900 dark:text-white">
                Today's Route
              </Text>
            </View>
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
  value: string;
  bgClass: string;
}) {
  return (
    <View
      className={`rounded-2xl p-4 ${bgClass}`}
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole="text"
    >
      <View className="mb-2">{icon}</View>
      <Text className="text-2xl font-bold text-slate-900 dark:text-white" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text className="text-sm text-slate-500 dark:text-slate-400">{label}</Text>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
