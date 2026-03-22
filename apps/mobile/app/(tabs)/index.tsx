import { View, Text, FlatList, RefreshControl, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ClipboardList, CheckCircle2, MapPin, DollarSign } from "lucide-react-native";
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
  const isDark = useColorScheme() === "dark";

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

  // Signal accent color
  const accent = isDark ? "#FB923C" : "#EA580C";

  return (
    <SafeAreaView className="flex-1 bg-orange-50/50 dark:bg-stone-900" edges={["top"]}>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={accent} />
        }
        ListHeaderComponent={
          <View className="pt-2 pb-4">
            {/* Greeting — Signal: extra bold */}
            <Text className="text-3xl font-heading-bold text-stone-900 dark:text-stone-50 mb-1">
              {getGreeting()}, {user?.firstName || "Tech"}
            </Text>
            <Text className="text-base font-semibold text-stone-500 dark:text-stone-400 mb-5">
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

            {/* Stats — Signal: orange accent, top border accent */}
            <View className="flex-row gap-3 mb-5">
              <Animated.View className="flex-1" entering={FadeInDown.delay(0).duration(400).springify()}>
                <StatCard
                  icon={<ClipboardList size={24} color={accent} />}
                  label="Today's Jobs"
                  value={String(stats.total)}
                  isDark={isDark}
                />
              </Animated.View>
              <Animated.View className="flex-1" entering={FadeInDown.delay(80).duration(400).springify()}>
                <StatCard
                  icon={<CheckCircle2 size={24} color="#16A34A" />}
                  label="Completed"
                  value={String(stats.completed)}
                  isDark={isDark}
                  green
                />
              </Animated.View>
            </View>

            {/* Daily Earnings */}
            {stats.earnings > 0 && (
              <Animated.View className="mb-5" entering={FadeInDown.delay(160).duration(400).springify()}>
                <View
                  className="bg-white dark:bg-stone-800 rounded-xl p-4"
                  style={{
                    borderTopWidth: 3,
                    borderTopColor: "#16A34A",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                  accessibilityLabel={`Today's earnings: $${stats.earnings.toFixed(2)}`}
                  accessibilityRole="text"
                >
                  <View className="mb-2">
                    <DollarSign size={24} color="#16A34A" />
                  </View>
                  <Text className="text-3xl font-heading-bold text-green-600 dark:text-green-400" numberOfLines={1} adjustsFontSizeToFit>
                    ${stats.earnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <Text className="text-sm font-bold text-stone-500 dark:text-stone-400">Today's Earnings</Text>
                </View>
              </Animated.View>
            )}

            {/* Next Job Card */}
            {nextJob && (
              <View className="mb-5">
                <NextJobCard job={nextJob} />
              </View>
            )}

            {/* Section header — Route Sheet */}
            <View className="flex-row items-center gap-2">
              <MapPin size={18} color={accent} />
              <Text className="text-xl font-heading-bold text-stone-900 dark:text-stone-50">
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
                <View key={i} className="bg-white dark:bg-stone-800 rounded-xl p-4 gap-2" style={{ shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 }}>
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

// Signal stat card — orange top border accent
function StatCard({
  icon,
  label,
  value,
  isDark,
  green,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isDark: boolean;
  green?: boolean;
}) {
  return (
    <View
      className="bg-white dark:bg-stone-800 rounded-xl p-4"
      style={{
        borderTopWidth: 3,
        borderTopColor: green ? "#16A34A" : (isDark ? "#FB923C" : "#EA580C"),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole="text"
    >
      <View className="mb-2">{icon}</View>
      <Text className="text-3xl font-heading-bold text-orange-600 dark:text-orange-400" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text className="text-sm font-bold text-stone-500 dark:text-stone-400">{label}</Text>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
