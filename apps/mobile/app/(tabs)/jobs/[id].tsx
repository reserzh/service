import { useState, useCallback, useMemo, useRef } from "react";
import { View, Text, Pressable, Alert, Linking } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  Phone,
  Navigation,
  MessageSquare,
  Camera,
  Send,
  Receipt,
  ChevronRight,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import BottomSheet from "@gorhom/bottom-sheet";
import { useJob, useUpdateJobStatus, useUpdateJob } from "@/hooks/useJobs";
import { useJobStats } from "@/hooks/useJobStats";
import { startLocationTracking, stopLocationTracking } from "@/lib/locationTracking";
import { useCreateInvoiceFromJob } from "@/hooks/useInvoices";
import { CreateInvoiceSheet } from "@/components/job/CreateInvoiceSheet";
import { JobDetailTabs, type JobTab } from "@/components/job/JobDetailTabs";
import { JobOverviewTab } from "@/components/job/JobOverviewTab";
import { JobWorkTab } from "@/components/job/JobWorkTab";
import { JobMediaTab } from "@/components/job/JobMediaTab";
import { JobHistoryTab } from "@/components/job/JobHistoryTab";
import { JobStatusBadge } from "@/components/job/JobStatusBadge";
import { JobPriorityBadge } from "@/components/job/JobPriorityBadge";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { ErrorFallback } from "@/components/common/ErrorFallback";
import { formatAddress, formatTimeRange } from "@/lib/format";
import { PRIMARY_NEXT_STATUS, STATUS_ACTION_LABELS } from "@/lib/constants";
import { STATUS_ACTION_COLORS } from "@/lib/colors";
import { useSignalColors } from "@/hooks/useSignalColors";
import type { JobStatus } from "@/types/models";

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useJob(id);
  const updateStatus = useUpdateJobStatus();
  const updateJob = useUpdateJob();
  const createInvoice = useCreateInvoiceFromJob();
  const [activeTab, setActiveTab] = useState<JobTab>("overview");
  const invoiceSheetRef = useRef<BottomSheet>(null);
  const colors = useSignalColors();
  const accent = colors.accent;

  const job = data?.data;

  const primaryAction = useMemo(() => {
    if (!job) return null;
    const nextStatus = PRIMARY_NEXT_STATUS[job.status];
    if (!nextStatus) return null;
    return {
      status: nextStatus,
      label: STATUS_ACTION_LABELS[job.status] ?? `Move to ${nextStatus}`,
      color: STATUS_ACTION_COLORS[job.status] ?? "bg-orange-600",
    };
  }, [job]);

  const handleStatusChange = useCallback(
    async (newStatus: JobStatus) => {
      if (!job) return;

      const isForwardTransition = ["en_route", "in_progress", "completed"].includes(newStatus);

      const doTransition = async () => {
        try {
          let coords: { latitude: number; longitude: number } | undefined;
          if (newStatus === "en_route" || newStatus === "in_progress" || newStatus === "completed") {
            try {
              const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
              if (permStatus === "granted") {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
              }
            } catch {
              // GPS capture is best-effort
            }
          }

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await updateStatus.mutateAsync({ id: job.id, status: newStatus, coords });
          Toast.show({ type: "success", text1: "Status updated" });

          if (newStatus === "en_route") {
            const started = await startLocationTracking(job.id);
            if (!started) {
              Toast.show({
                type: "info",
                text1: "Background location unavailable",
                text2: "Enable location permissions for live tracking",
              });
            }
          } else if (job.status === "en_route") {
            await stopLocationTracking();
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Failed to update status";
          Toast.show({ type: "error", text1: "Error", text2: msg });
        }
      };

      if (isForwardTransition) {
        await doTransition();
      } else {
        const labels: Record<string, string> = {
          canceled: "Cancel this job?",
          dispatched: "Move back to dispatched?",
        };

        Alert.alert(
          labels[newStatus] ?? `Change status to ${newStatus}?`,
          "This action will update the job status.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Confirm", onPress: doTransition },
          ]
        );
      }
    },
    [job, updateStatus]
  );

  const handleStartTimer = useCallback(() => {
    if (!job) return;
    updateJob.mutate({
      id: job.id,
      data: { actualStart: new Date().toISOString() },
    });
  }, [job, updateJob]);

  const handleStopTimer = useCallback(() => {
    if (!job) return;
    updateJob.mutate({
      id: job.id,
      data: { actualEnd: new Date().toISOString() },
    });
  }, [job, updateJob]);

  const handleCall = useCallback(() => {
    if (!job) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${job.customer.phone}`);
  }, [job]);

  const handleNavigate = useCallback(() => {
    if (!job) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const address = formatAddress(job.property);
    const encoded = encodeURIComponent(address);
    Linking.openURL(`maps://app?daddr=${encoded}`).catch(() => {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${encoded}`
      );
    });
  }, [job]);

  if (isError) {
    return <ErrorFallback message={`Failed to load job details: ${error?.message ?? "unknown"}`} onRetry={() => refetch()} />;
  }

  if (isLoading || !job) {
    return <LoadingScreen />;
  }

  const isEnRoute = job.status === "en_route";
  const showCreateInvoice = job.status === "completed";

  // Find the next upcoming job for "dispatch to next" flow
  const { jobs: todayJobs } = useJobStats();
  const nextUpJob = useMemo(() => {
    if (job.status !== "completed") return null;
    const now = new Date();
    return todayJobs.find(
      (j) =>
        j.id !== job.id &&
        (j.status === "scheduled" || j.status === "dispatched") &&
        j.scheduledStart &&
        new Date(j.scheduledStart) >= now
    ) ?? null;
  }, [job.status, job.id, todayJobs]);

  return (
    <View className="flex-1 bg-orange-50/50 dark:bg-stone-900">
      {/* Fixed Header — Signal: warm stone, orange accent */}
      <View
        className="px-4 pt-4 pb-3 bg-white dark:bg-stone-800"
        style={{
          borderBottomWidth: 3,
          borderBottomColor: accent,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {job.jobNumber}
            </Text>
            <Text className="text-sm text-stone-300 dark:text-stone-600">·</Text>
            <Text className="text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {job.jobType}
            </Text>
          </View>
        </View>
        <Text className="text-xl font-heading-bold text-stone-900 dark:text-stone-50 mb-2" numberOfLines={1}>
          {job.summary}
        </Text>
        <View className="flex-row items-center gap-2">
          <JobStatusBadge status={job.status} size="md" />
          <JobPriorityBadge priority={job.priority} />
        </View>
      </View>

      {/* Tabs */}
      <JobDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <View className="flex-1">
        {activeTab === "overview" && <JobOverviewTab job={job} />}
        {activeTab === "work" && (
          <JobWorkTab
            job={job}
            onStatusChange={handleStatusChange}
            onStartTimer={handleStartTimer}
            onStopTimer={handleStopTimer}
          />
        )}
        {activeTab === "media" && <JobMediaTab job={job} />}
        {activeTab === "history" && <JobHistoryTab job={job} />}
      </View>

      {/* Fixed Bottom Action Bar — Signal styling */}
      <View
        className="px-4 pt-3 pb-8 bg-white dark:bg-stone-800"
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {/* En route indicator */}
        {isEnRoute && (
          <View className="flex-row items-center justify-center rounded-lg px-3 py-2 mb-3 bg-orange-50 dark:bg-orange-900/30">
            <Send size={14} color={accent} />
            <Text className="ml-2 text-xs font-bold text-orange-700 dark:text-orange-300">
              Sharing live location with customer
            </Text>
          </View>
        )}

        {/* Quick action icons */}
        <View className="flex-row items-center justify-center mb-3 gap-5">
          <Pressable
            onPress={handleCall}
            className="items-center gap-1 active:opacity-70"
            accessibilityLabel="Call customer"
            accessibilityRole="button"
          >
            <View className="rounded-full items-center justify-center w-14 h-14 bg-emerald-100 dark:bg-emerald-900">
              <Phone size={24} color="#16a34a" />
            </View>
            <Text className="text-xs font-bold text-stone-500 dark:text-stone-400">Call</Text>
          </Pressable>

          <Pressable
            onPress={handleNavigate}
            className="items-center gap-1 active:opacity-70"
            accessibilityLabel="Navigate to job"
            accessibilityRole="button"
          >
            <View className="rounded-full items-center justify-center w-14 h-14 bg-orange-100 dark:bg-orange-900">
              <Navigation size={24} color={accent} />
            </View>
            <Text className="text-xs font-bold text-stone-500 dark:text-stone-400">Navigate</Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("work")}
            className="items-center gap-1 active:opacity-70"
            accessibilityLabel="Add note"
            accessibilityRole="button"
          >
            <View className="rounded-full items-center justify-center w-14 h-14 bg-amber-100 dark:bg-amber-900">
              <MessageSquare size={24} color="#d97706" />
            </View>
            <Text className="text-xs font-bold text-stone-500 dark:text-stone-400">Note</Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("media")}
            className="items-center gap-1 active:opacity-70"
            accessibilityLabel="Take photo"
            accessibilityRole="button"
          >
            <View className="rounded-full items-center justify-center w-14 h-14 bg-stone-100 dark:bg-stone-700">
              <Camera size={24} color={colors.textSecondary} />
            </View>
            <Text className="text-xs font-bold text-stone-500 dark:text-stone-400">Photo</Text>
          </Pressable>

          {showCreateInvoice && (
            <Pressable
              onPress={() => invoiceSheetRef.current?.snapToIndex(0)}
              className="items-center gap-1 active:opacity-70"
              accessibilityLabel="Create invoice"
              accessibilityRole="button"
            >
              <View className="rounded-full items-center justify-center w-14 h-14 bg-emerald-100 dark:bg-emerald-900">
                <Receipt size={24} color="#16a34a" />
              </View>
              <Text className="text-xs font-bold text-stone-500 dark:text-stone-400">Invoice</Text>
            </Pressable>
          )}
        </View>

        {/* Photo gate inline indicator */}
        {primaryAction?.status === "completed" && (() => {
          const afterCount = job.photos.filter((p) => p.photoType === "after").length;
          const needed = 3;
          if (afterCount < needed) {
            return (
              <Pressable
                onPress={() => setActiveTab("media")}
                className="flex-row items-center justify-between rounded-xl px-4 py-3 mb-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800"
              >
                <View className="flex-row items-center gap-2">
                  <Camera size={16} color="#d97706" />
                  <Text className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    {afterCount}/{needed} after photos required
                  </Text>
                </View>
                <Text className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  Tap to add
                </Text>
              </Pressable>
            );
          }
          return null;
        })()}

        {/* Next Job prompt — shown after completing this job */}
        {nextUpJob && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push(`/(tabs)/jobs/${nextUpJob.id}`);
            }}
            className="flex-row items-center justify-between rounded-xl px-4 py-3.5 mb-2 bg-orange-100 dark:bg-orange-900/40 border border-orange-300 dark:border-orange-800"
            accessibilityLabel={`Go to next job: ${nextUpJob.summary}`}
            accessibilityRole="button"
          >
            <View className="flex-1 mr-3">
              <Text className="text-xs font-extrabold uppercase tracking-widest text-orange-600 dark:text-orange-400 mb-0.5">
                Next Job
              </Text>
              <Text className="text-sm font-bold text-stone-900 dark:text-stone-50" numberOfLines={1}>
                {nextUpJob.summary}
              </Text>
              {nextUpJob.scheduledStart && (
                <Text className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                  {formatTimeRange(nextUpJob.scheduledStart, nextUpJob.scheduledEnd)}
                </Text>
              )}
            </View>
            <View className="bg-orange-600 dark:bg-orange-500 rounded-full p-2">
              <ChevronRight size={18} color="#ffffff" />
            </View>
          </Pressable>
        )}

        {/* Primary action button */}
        {primaryAction && (() => {
          const isPhotoGated = primaryAction.status === "completed" &&
            job.photos.filter((p) => p.photoType === "after").length < 3;
          return (
            <Pressable
              onPress={() => handleStatusChange(primaryAction.status)}
              disabled={updateStatus.isPending || isPhotoGated}
              className={`flex-row items-center justify-center rounded-xl active:opacity-90 ${primaryAction.color} py-5 min-h-[64px] ${isPhotoGated ? "opacity-50" : ""}`}
            >
              <Text className="text-xl font-extrabold tracking-wide text-white">
                {updateStatus.isPending ? "Updating..." : primaryAction.label}
              </Text>
            </Pressable>
          );
        })()}
      </View>

      {/* Create Invoice Sheet */}
      {showCreateInvoice && (
        <CreateInvoiceSheet
          job={job}
          sheetRef={invoiceSheetRef}
          onSubmit={async (data) => {
            await createInvoice.mutateAsync({ jobId: job.id, taxRate: data.taxRate });
          }}
        />
      )}
    </View>
  );
}
