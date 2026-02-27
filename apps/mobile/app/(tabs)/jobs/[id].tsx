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
import { useJob, useUpdateJobStatus, useUpdateJob, useNotifyOnMyWay } from "@/hooks/useJobs";
import { useCreateInvoiceFromJob } from "@/hooks/useInvoices";
import { useSettingsStore } from "@/stores/settings";
import { FieldModeToggle } from "@/components/common/FieldModeToggle";
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
  const { data, isLoading, isError, refetch } = useJob(id);
  const updateStatus = useUpdateJobStatus();
  const updateJob = useUpdateJob();
  const notifyOnMyWay = useNotifyOnMyWay();
  const createInvoice = useCreateInvoiceFromJob();
  const fieldMode = useSettingsStore((s) => s.fieldMode);
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
    (newStatus: JobStatus) => {
      if (!job) return;

      const labels: Record<string, string> = {
        in_progress: "Start this job?",
        completed: "Mark this job as completed?",
        canceled: "Cancel this job?",
        dispatched: "Move back to dispatched?",
      };

      Alert.alert(
        labels[newStatus] ?? `Change status to ${newStatus}?`,
        "This action will update the job status.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Confirm",
            onPress: async () => {
              try {
                // Capture GPS for in_progress and completed transitions
                let coords: { latitude: number; longitude: number } | undefined;
                if (newStatus === "in_progress" || newStatus === "completed") {
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
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Failed to update status";
                Toast.show({ type: "error", text1: "Error", text2: msg });
              }
            },
          },
        ]
      );
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

  const handleOnMyWay = useCallback(async () => {
    if (!job) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await notifyOnMyWay.mutateAsync(job.id);
      Toast.show({ type: "success", text1: "Customer notified", text2: "On my way notification sent" });
    } catch {
      Toast.show({ type: "error", text1: "Failed to notify customer" });
    }
  }, [job, notifyOnMyWay]);

  if (isError) {
    return <ErrorFallback message="Failed to load job details" onRetry={() => refetch()} />;
  }

  if (isLoading || !job) {
    return <LoadingScreen />;
  }

  const showOnMyWay = job.status === "dispatched";
  const showCreateInvoice = job.status === "completed";

  // Field mode sizing
  const quickActionSize = fieldMode ? "w-14 h-14" : "w-10 h-10";
  const quickActionIconSize = fieldMode ? 24 : 18;
  const quickActionLabelSize = fieldMode ? "text-xs" : "text-[10px]";

  return (
    <View className={`flex-1 ${fieldMode ? "bg-black" : "bg-slate-50 dark:bg-slate-950"}`}>
      {/* Fixed Header */}
      <View className={`px-4 pt-4 pb-2 border-b ${
        fieldMode
          ? "bg-[#1A1A1A] border-[#333]"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
      }`}>
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center gap-2">
            <Text className={`text-xs font-medium uppercase tracking-wide ${
              fieldMode ? "text-[#B0B0B0]" : "text-slate-500"
            }`}>
              {job.jobNumber}
            </Text>
            <Text className={`text-xs ${fieldMode ? "text-[#555]" : "text-slate-300"}`}>·</Text>
            <Text className={`text-xs font-medium uppercase tracking-wide ${
              fieldMode ? "text-[#B0B0B0]" : "text-slate-500"
            }`}>
              {job.jobType}
            </Text>
          </View>
          <FieldModeToggle />
        </View>
        <Text className={`font-bold mb-2 ${
          fieldMode ? "text-2xl text-white" : "text-xl text-slate-900 dark:text-white"
        }`} numberOfLines={1}>
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
      <View className={`border-t px-4 pt-3 pb-8 ${
        fieldMode
          ? "bg-[#1A1A1A] border-[#333]"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
      }`}>
        {/* Quick action icons */}
        <View className={`flex-row items-center justify-center mb-3 ${fieldMode ? "gap-5" : "gap-4"}`}>
          <Pressable
            onPress={handleCall}
            className="items-center gap-1 active:opacity-70"
            accessibilityLabel="Call customer"
            accessibilityRole="button"
          >
            <View className={`rounded-full items-center justify-center ${quickActionSize} ${
              fieldMode ? "bg-emerald-900" : "bg-emerald-100 dark:bg-emerald-900"
            }`}>
              <Phone size={quickActionIconSize} color={fieldMode ? "#00E676" : "#10b981"} />
            </View>
            <Text className={`${quickActionLabelSize} ${fieldMode ? "text-[#B0B0B0]" : "text-slate-500"}`}>Call</Text>
          </Pressable>

          <Pressable
            onPress={handleNavigate}
            className="items-center gap-1 active:opacity-70"
            accessibilityLabel="Navigate to job"
            accessibilityRole="button"
          >
            <View className={`rounded-full items-center justify-center ${quickActionSize} ${
              fieldMode ? "bg-blue-900" : "bg-blue-100 dark:bg-blue-900"
            }`}>
              <Navigation size={quickActionIconSize} color="#3b82f6" />
            </View>
            <Text className={`${quickActionLabelSize} ${fieldMode ? "text-[#B0B0B0]" : "text-slate-500"}`}>Navigate</Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("work")}
            className="items-center gap-1 active:opacity-70"
            accessibilityLabel="Add note"
            accessibilityRole="button"
          >
            <View className={`rounded-full items-center justify-center ${quickActionSize} ${
              fieldMode ? "bg-violet-900" : "bg-violet-100 dark:bg-violet-900"
            }`}>
              <MessageSquare size={quickActionIconSize} color="#8b5cf6" />
            </View>
            <Text className={`${quickActionLabelSize} ${fieldMode ? "text-[#B0B0B0]" : "text-slate-500"}`}>Note</Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("media")}
            className="items-center gap-1 active:opacity-70"
            accessibilityLabel="Take photo"
            accessibilityRole="button"
          >
            <View className={`rounded-full items-center justify-center ${quickActionSize} ${
              fieldMode ? "bg-amber-900" : "bg-amber-100 dark:bg-amber-900"
            }`}>
              <Camera size={quickActionIconSize} color="#f59e0b" />
            </View>
            <Text className={`${quickActionLabelSize} ${fieldMode ? "text-[#B0B0B0]" : "text-slate-500"}`}>Photo</Text>
          </Pressable>

          {showOnMyWay && (
            <Pressable
              onPress={handleOnMyWay}
              className="items-center gap-1 active:opacity-70"
              accessibilityLabel="Notify customer on my way"
              accessibilityRole="button"
            >
              <View className={`rounded-full items-center justify-center ${quickActionSize} ${
                fieldMode ? "bg-indigo-900" : "bg-indigo-100 dark:bg-indigo-900"
              }`}>
                <Send size={quickActionIconSize} color="#6366f1" />
              </View>
              <Text className={`${quickActionLabelSize} ${fieldMode ? "text-[#B0B0B0]" : "text-slate-500"}`}>On Way</Text>
            </Pressable>
          )}

          {showCreateInvoice && (
            <Pressable
              onPress={() => invoiceSheetRef.current?.snapToIndex(0)}
              className="items-center gap-1 active:opacity-70"
              accessibilityLabel="Create invoice"
              accessibilityRole="button"
            >
              <View className={`rounded-full items-center justify-center ${quickActionSize} ${
                fieldMode ? "bg-green-900" : "bg-green-100 dark:bg-green-900"
              }`}>
                <Receipt size={quickActionIconSize} color="#22c55e" />
              </View>
              <Text className={`${quickActionLabelSize} ${fieldMode ? "text-[#B0B0B0]" : "text-slate-500"}`}>Invoice</Text>
            </Pressable>
          )}
        </View>

        {/* Primary action button */}
        {primaryAction && (
          <Pressable
            onPress={() => handleStatusChange(primaryAction.status)}
            disabled={updateStatus.isPending}
            className={`flex-row items-center justify-center rounded-2xl active:opacity-90 ${
              fieldMode
                ? "bg-[#FF6B00] py-5"
                : `${primaryAction.color} py-4`
            }`}
            style={fieldMode ? { minHeight: 64 } : undefined}
          >
            <Text className={`font-bold text-white ${fieldMode ? "text-xl" : "text-lg"}`}>
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
