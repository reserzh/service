import { useState, useCallback, useMemo, useRef } from "react";
import { View, Text, Pressable, Alert, Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  Phone,
  Navigation,
  MessageSquare,
  Camera,
  Send,
  Receipt,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import BottomSheet from "@gorhom/bottom-sheet";
import { useJob, useUpdateJobStatus, useUpdateJob } from "@/hooks/useJobs";
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
import { formatAddress } from "@/lib/format";
import { PRIMARY_NEXT_STATUS, STATUS_ACTION_LABELS } from "@/lib/constants";
import { STATUS_ACTION_COLORS } from "@/lib/colors";
import type { JobStatus } from "@/types/models";

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useJob(id);
  const updateStatus = useUpdateJobStatus();
  const updateJob = useUpdateJob();
  const createInvoice = useCreateInvoiceFromJob();
  const [activeTab, setActiveTab] = useState<JobTab>("overview");
  const invoiceSheetRef = useRef<BottomSheet>(null);

  const job = data?.data;

  const primaryAction = useMemo(() => {
    if (!job) return null;
    const nextStatus = PRIMARY_NEXT_STATUS[job.status];
    if (!nextStatus) return null;
    return {
      status: nextStatus,
      label: STATUS_ACTION_LABELS[job.status] ?? `Move to ${nextStatus}`,
      color: STATUS_ACTION_COLORS[job.status] ?? "bg-blue-600",
    };
  }, [job]);

  const handleStatusChange = useCallback(
    async (newStatus: JobStatus) => {
      if (!job) return;

      // Forward transitions skip confirmation; backward/cancel require it
      const isForwardTransition = ["en_route", "in_progress", "completed"].includes(newStatus);

      const doTransition = async () => {
        try {
          // Capture GPS for en_route, in_progress and completed transitions
          let coords: { latitude: number; longitude: number } | undefined;
          if (newStatus === "en_route" || newStatus === "in_progress" || newStatus === "completed") {
            try {
              const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
              if (permStatus === "granted") {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
              }
            } catch {
              // GPS capture is best-effort, proceed without coords
            }
          }

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await updateStatus.mutateAsync({ id: job.id, status: newStatus, coords });
          Toast.show({ type: "success", text1: "Status updated" });

          // Start/stop background location tracking
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
        // No confirmation for standard forward transitions
        await doTransition();
      } else {
        // Backward/cancel transitions still need confirmation
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

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Fixed Header */}
      <View className="px-4 pt-4 pb-2 border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-medium uppercase tracking-wide text-slate-500">
              {job.jobNumber}
            </Text>
            <Text className="text-sm text-slate-300">·</Text>
            <Text className="text-sm font-medium uppercase tracking-wide text-slate-500">
              {job.jobType}
            </Text>
          </View>
        </View>
        <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2" numberOfLines={1}>
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

      {/* Fixed Bottom Action Bar */}
      <View className="border-t px-4 pt-3 pb-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        {/* En route indicator */}
        {isEnRoute && (
          <View className="flex-row items-center justify-center rounded-lg px-3 py-2 mb-3 bg-indigo-50 dark:bg-indigo-900/30">
            <Send size={14} color="#6366f1" />
            <Text className="ml-2 text-xs font-medium text-indigo-700 dark:text-indigo-300">
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
              <Phone size={24} color="#10b981" />
            </View>
            <Text className="text-xs text-slate-500">Call</Text>
          </Pressable>

          <Pressable
            onPress={handleNavigate}
            className="items-center gap-1 active:opacity-70"
            accessibilityLabel="Navigate to job"
            accessibilityRole="button"
          >
            <View className="rounded-full items-center justify-center w-14 h-14 bg-blue-100 dark:bg-blue-900">
              <Navigation size={24} color="#3b82f6" />
            </View>
            <Text className="text-xs text-slate-500">Navigate</Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("work")}
            className="items-center gap-1 active:opacity-70"
            accessibilityLabel="Add note"
            accessibilityRole="button"
          >
            <View className="rounded-full items-center justify-center w-14 h-14 bg-violet-100 dark:bg-violet-900">
              <MessageSquare size={24} color="#8b5cf6" />
            </View>
            <Text className="text-xs text-slate-500">Note</Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("media")}
            className="items-center gap-1 active:opacity-70"
            accessibilityLabel="Take photo"
            accessibilityRole="button"
          >
            <View className="rounded-full items-center justify-center w-14 h-14 bg-amber-100 dark:bg-amber-900">
              <Camera size={24} color="#f59e0b" />
            </View>
            <Text className="text-xs text-slate-500">Photo</Text>
          </Pressable>

          {showCreateInvoice && (
            <Pressable
              onPress={() => invoiceSheetRef.current?.snapToIndex(0)}
              className="items-center gap-1 active:opacity-70"
              accessibilityLabel="Create invoice"
              accessibilityRole="button"
            >
              <View className="rounded-full items-center justify-center w-14 h-14 bg-green-100 dark:bg-green-900">
                <Receipt size={24} color="#22c55e" />
              </View>
              <Text className="text-xs text-slate-500">Invoice</Text>
            </Pressable>
          )}
        </View>

        {/* Primary action button */}
        {primaryAction && (
          <Pressable
            onPress={() => handleStatusChange(primaryAction.status)}
            disabled={updateStatus.isPending}
            className={`flex-row items-center justify-center rounded-2xl active:opacity-90 ${primaryAction.color} py-5 min-h-[64px]`}
          >
            <Text className="text-xl font-bold text-white">
              {updateStatus.isPending ? "Updating..." : primaryAction.label}
            </Text>
          </Pressable>
        )}
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
