import { useState, useMemo, useCallback } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isToday,
  parseISO,
  differenceInMinutes,
  setHours,
} from "date-fns";
import { ChevronLeft, ChevronRight, List, Clock } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSchedule } from "@/hooks/useSchedule";
import { useAuthStore } from "@/stores/auth";
import { JobCard } from "@/components/job/JobCard";
import { JobStatusBadge } from "@/components/job/JobStatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatTime } from "@/lib/format";
import { JOB_STATUS_COLORS } from "@/lib/colors";
import type { Job, JobStatus } from "@/types/models";

type ViewMode = "day" | "week";
type ViewStyle = "list" | "timeline";

const TIMELINE_START_HOUR = 6;
const TIMELINE_END_HOUR = 20;
const HOUR_HEIGHT = 60;
const TIMELINE_HOURS = Array.from(
  { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
  (_, i) => TIMELINE_START_HOUR + i
);

export default function ScheduleScreen() {
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [viewStyle, setViewStyle] = useState<ViewStyle>("list");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const dateRange = useMemo(() => {
    if (viewMode === "day") {
      return {
        from: startOfDay(selectedDate).toISOString(),
        to: endOfDay(selectedDate).toISOString(),
      };
    }
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return {
      from: startOfDay(weekStart).toISOString(),
      to: endOfDay(endOfWeek(selectedDate, { weekStartsOn: 1 })).toISOString(),
    };
  }, [selectedDate, viewMode]);

  const { data, isLoading, refetch } = useSchedule({
    ...dateRange,
    technicianId: user?.userId,
  });

  const jobs = data?.data ?? [];

  // For week view, group by day
  const weekDays = useMemo(() => {
    if (viewMode !== "week") return [];
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate, viewMode]);

  // For day view, separate scheduled vs unscheduled
  const { scheduledJobs, unscheduledJobs } = useMemo(() => {
    const dayJobs =
      viewMode === "week"
        ? jobs.filter(
            (j) =>
              j.scheduledStart &&
              isSameDay(new Date(j.scheduledStart), selectedDate)
          )
        : jobs;

    return {
      scheduledJobs: dayJobs.filter((j) => j.scheduledStart),
      unscheduledJobs: dayJobs.filter((j) => !j.scheduledStart),
    };
  }, [jobs, viewMode, selectedDate]);

  const handlePrev = () => {
    setSelectedDate((d) => addDays(d, viewMode === "day" ? -1 : -7));
  };
  const handleNext = () => {
    setSelectedDate((d) => addDays(d, viewMode === "day" ? 1 : 7));
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    // Timeline only available in day mode
    if (mode === "week") setViewStyle("list");
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      {/* Header */}
      <View className="px-4 pt-2 pb-3">
        {/* View toggle */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            {(["day", "week"] as ViewMode[]).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => handleViewModeChange(mode)}
                className={`px-4 py-1.5 rounded-md ${
                  viewMode === mode ? "bg-white dark:bg-slate-700 shadow-sm" : ""
                }`}
              >
                <Text
                  className={`text-sm font-medium capitalize ${
                    viewMode === mode
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-500"
                  }`}
                >
                  {mode}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row items-center gap-2">
            {/* Timeline / list toggle (day mode only) */}
            {viewMode === "day" && (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setViewStyle((s) => (s === "list" ? "timeline" : "list"));
                }}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800"
              >
                {viewStyle === "list" ? (
                  <Clock size={18} color="#64748b" />
                ) : (
                  <List size={18} color="#64748b" />
                )}
              </Pressable>
            )}
            <Pressable
              onPress={() => setSelectedDate(new Date())}
              className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950"
            >
              <Text className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Today
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Date navigation */}
        <View className="flex-row items-center justify-between">
          <Pressable onPress={handlePrev} hitSlop={12} className="p-1">
            <ChevronLeft size={24} color="#64748b" />
          </Pressable>
          <Text className="text-lg font-semibold text-slate-900 dark:text-white">
            {viewMode === "day"
              ? format(selectedDate, "EEEE, MMM d")
              : `${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM d")} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM d")}`}
          </Text>
          <Pressable onPress={handleNext} hitSlop={12} className="p-1">
            <ChevronRight size={24} color="#64748b" />
          </Pressable>
        </View>
      </View>

      {/* Week day selector (week view only) */}
      {viewMode === "week" && (
        <View className="flex-row px-2 mb-2">
          {weekDays.map((day) => {
            const hasJobs = jobs.some(
              (j) => j.scheduledStart && isSameDay(new Date(j.scheduledStart), day)
            );
            const selected = isSameDay(day, selectedDate);
            return (
              <Pressable
                key={day.toISOString()}
                onPress={() => setSelectedDate(day)}
                className={`flex-1 items-center py-2 rounded-xl mx-0.5 ${
                  selected ? "bg-blue-600" : ""
                }`}
              >
                <Text
                  className={`text-xs font-medium mb-1 ${
                    selected ? "text-blue-200" : "text-slate-500"
                  }`}
                >
                  {format(day, "EEE")}
                </Text>
                <Text
                  className={`text-lg font-bold ${
                    selected
                      ? "text-white"
                      : isToday(day)
                      ? "text-blue-600"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  {format(day, "d")}
                </Text>
                {hasJobs && !selected && (
                  <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Content */}
      {viewMode === "day" && viewStyle === "timeline" ? (
        <TimelineView
          jobs={scheduledJobs}
          unscheduledJobs={unscheduledJobs}
          selectedDate={selectedDate}
          isLoading={isLoading}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      ) : (
        <FlatList
          data={
            viewMode === "week"
              ? jobs.filter(
                  (j) =>
                    j.scheduledStart &&
                    isSameDay(new Date(j.scheduledStart), selectedDate)
                )
              : jobs
          }
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
                {[1, 2].map((i) => (
                  <View key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 gap-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-5 w-48" />
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState
                title="No jobs scheduled"
                description="Nothing on the schedule for this day"
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

// ----- Timeline View -----

function TimelineView({
  jobs,
  unscheduledJobs,
  selectedDate,
  isLoading,
  refreshing,
  onRefresh,
}: {
  jobs: Job[];
  unscheduledJobs: Job[];
  selectedDate: Date;
  isLoading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const totalHeight = (TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1) * HOUR_HEIGHT;
  const showingToday = isToday(selectedDate);

  // Calculate current time position
  const now = new Date();
  const currentTimeTop = useMemo(() => {
    if (!showingToday) return -1;
    const minutesSinceStart =
      (now.getHours() - TIMELINE_START_HOUR) * 60 + now.getMinutes();
    return (minutesSinceStart / 60) * HOUR_HEIGHT;
  }, [showingToday, now]);

  if (isLoading) {
    return (
      <View className="flex-1 px-4 gap-3 pt-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerClassName="pb-8"
    >
      {/* Timeline grid */}
      <View className="flex-row px-2" style={{ height: totalHeight }}>
        {/* Hour labels */}
        <View className="w-14">
          {TIMELINE_HOURS.map((hour) => (
            <View
              key={hour}
              style={{ height: HOUR_HEIGHT }}
              className="justify-start"
            >
              <Text className="text-xs text-slate-400 text-right pr-2 -mt-1.5">
                {format(setHours(new Date(), hour), "h a")}
              </Text>
            </View>
          ))}
        </View>

        {/* Grid + blocks */}
        <View className="flex-1 relative">
          {/* Hour grid lines */}
          {TIMELINE_HOURS.map((hour) => (
            <View
              key={hour}
              style={{ height: HOUR_HEIGHT }}
              className="border-t border-slate-200 dark:border-slate-800"
            />
          ))}

          {/* Current time line */}
          {showingToday && currentTimeTop >= 0 && currentTimeTop <= totalHeight && (
            <View
              className="absolute left-0 right-0 flex-row items-center"
              style={{ top: currentTimeTop }}
            >
              <View className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
              <View className="flex-1 h-0.5 bg-red-500" />
            </View>
          )}

          {/* Job blocks */}
          {jobs.map((job) => (
            <TimelineBlock key={job.id} job={job} />
          ))}
        </View>
      </View>

      {/* Unscheduled jobs section */}
      {unscheduledJobs.length > 0 && (
        <View className="px-4 mt-4">
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 px-1">
            Unscheduled
          </Text>
          {unscheduledJobs.map((job) => (
            <View key={job.id} className="mb-2">
              <JobCard
                job={job}
                onPress={() => router.push(`/(tabs)/jobs/${job.id}`)}
              />
            </View>
          ))}
        </View>
      )}

      {jobs.length === 0 && unscheduledJobs.length === 0 && (
        <View className="-mt-40">
          <EmptyState
            title="No jobs scheduled"
            description="Nothing on the schedule for this day"
          />
        </View>
      )}
    </ScrollView>
  );
}

function TimelineBlock({ job }: { job: Job }) {
  if (!job.scheduledStart) return null;

  const start = parseISO(job.scheduledStart);
  const end = job.scheduledEnd ? parseISO(job.scheduledEnd) : addDays(start, 0); // same time if no end

  const startMinutes =
    (start.getHours() - TIMELINE_START_HOUR) * 60 + start.getMinutes();
  const durationMinutes = job.scheduledEnd
    ? Math.max(differenceInMinutes(end, start), 30)
    : 60; // default 1 hour if no end time

  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const height = (durationMinutes / 60) * HOUR_HEIGHT;

  const statusColors = JOB_STATUS_COLORS[job.status as JobStatus];
  // Map NativeWind bg classes to actual colors for style prop
  const bgColorMap: Record<string, string> = {
    "bg-slate-100": "#f1f5f9",
    "bg-blue-100": "#dbeafe",
    "bg-indigo-100": "#e0e7ff",
    "bg-amber-100": "#fef3c7",
    "bg-emerald-100": "#d1fae5",
    "bg-red-100": "#fee2e2",
  };
  const dotColorMap: Record<string, string> = {
    "bg-slate-400": "#94a3b8",
    "bg-blue-500": "#3b82f6",
    "bg-indigo-500": "#6366f1",
    "bg-amber-500": "#f59e0b",
    "bg-emerald-500": "#10b981",
    "bg-red-400": "#f87171",
  };

  const bgColor = bgColorMap[statusColors.bg] ?? "#f1f5f9";
  const borderColor = dotColorMap[statusColors.dot] ?? "#94a3b8";

  return (
    <Pressable
      onPress={() => router.push(`/(tabs)/jobs/${job.id}`)}
      className="absolute left-1 right-1 rounded-lg px-2.5 py-1.5 overflow-hidden active:opacity-80"
      style={{
        top: Math.max(top, 0),
        height: Math.max(height, 28),
        backgroundColor: bgColor,
        borderLeftWidth: 3,
        borderLeftColor: borderColor,
      }}
    >
      <Text
        className="text-xs font-semibold text-slate-900"
        numberOfLines={1}
      >
        {job.summary}
      </Text>
      <Text className="text-[10px] text-slate-600">
        {formatTime(job.scheduledStart)}
        {job.scheduledEnd ? ` - ${formatTime(job.scheduledEnd)}` : ""}
      </Text>
    </Pressable>
  );
}
