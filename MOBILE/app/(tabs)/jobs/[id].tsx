import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Linking,
  Alert,
  TextInput,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  DollarSign,
  ChevronRight,
  Plus,
  Send,
  Camera,
  PenTool,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useJob, useUpdateJobStatus, useAddJobNote } from "@/hooks/useJobs";
import { PhotoGrid } from "@/components/job/PhotoGrid";
import { PhotoCapture } from "@/components/job/PhotoCapture";
import { SignatureList } from "@/components/job/SignatureList";
import { SignatureModal } from "@/components/job/SignatureModal";
import { DistanceBadge } from "@/components/job/DistanceBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { ErrorFallback } from "@/components/common/ErrorFallback";
import Animated, { FadeInDown } from "react-native-reanimated";
import { JobStatusBadge } from "@/components/job/JobStatusBadge";
import { JobPriorityBadge } from "@/components/job/JobPriorityBadge";
import { NavigateButton } from "@/components/common/NavigateButton";
import { formatCurrency, formatTimeRange, formatRelativeTime, formatAddress, formatCustomerName, formatPhone } from "@/lib/format";
import { PRIMARY_NEXT_STATUS, STATUS_ACTION_LABELS, VALID_TRANSITIONS } from "@/lib/constants";
import { STATUS_ACTION_COLORS } from "@/lib/colors";
import type { JobStatus } from "@/types/models";

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useJob(id);
  const updateStatus = useUpdateJobStatus();
  const addNote = useAddJobNote();
  const [refreshing, setRefreshing] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const job = data?.data;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

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

  const handleStatusChange = (newStatus: JobStatus) => {
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
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await updateStatus.mutateAsync({ id: job.id, status: newStatus });
              Toast.show({ type: "success", text1: "Status updated" });
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : "Failed to update status";
              Toast.show({ type: "error", text1: "Error", text2: msg });
            }
          },
        },
      ]
    );
  };

  const handleAddNote = async () => {
    if (!job || !noteText.trim()) return;
    try {
      await addNote.mutateAsync({ id: job.id, content: noteText.trim() });
      setNoteText("");
      setShowNoteInput(false);
      Toast.show({ type: "success", text1: "Note added" });
    } catch {
      Toast.show({ type: "error", text1: "Failed to add note" });
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (isError) {
    return <ErrorFallback message="Failed to load job details" onRetry={() => refetch()} />;
  }

  if (isLoading || !job) {
    return <LoadingScreen />;
  }

  const address = formatAddress(job.property);
  const lineItemTotal = job.lineItems.reduce(
    (sum, li) => sum + parseFloat(li.total),
    0
  );

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        contentContainerClassName="pb-32"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-3">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {job.jobNumber}
            </Text>
            <Text className="text-xs text-slate-300">·</Text>
            <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {job.jobType}
            </Text>
          </View>
          <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {job.summary}
          </Text>
          <View className="flex-row items-center gap-2">
            <JobStatusBadge status={job.status} size="md" />
            <JobPriorityBadge priority={job.priority} />
          </View>
        </View>

        {/* Schedule info */}
        {job.scheduledStart && (
          <View className="px-4 mb-4">
            <View className="flex-row items-center gap-2 bg-blue-50 dark:bg-blue-950 rounded-xl px-4 py-3">
              <Clock size={18} color="#3b82f6" />
              <Text className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {formatTimeRange(job.scheduledStart, job.scheduledEnd)}
              </Text>
            </View>
          </View>
        )}

        {/* Customer Card */}
        <Animated.View className="px-4 mb-3" entering={FadeInDown.delay(0).duration(400).springify()}>
          <Card>
            <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Customer
            </Text>
            <Text className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              {formatCustomerName(job.customer)}
            </Text>
            {job.customer.companyName && (
              <Text className="text-sm text-slate-500 mb-1">
                {job.customer.companyName}
              </Text>
            )}
            <View className="flex-row items-center gap-3 mt-2">
              <Pressable
                onPress={() => handleCall(job.customer.phone)}
                className="flex-row items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950 px-3 py-2 rounded-lg active:bg-emerald-100"
              >
                <Phone size={14} color="#10b981" />
                <Text className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  {formatPhone(job.customer.phone)}
                </Text>
              </Pressable>
            </View>
          </Card>
        </Animated.View>

        {/* Property / Address Card */}
        <Animated.View className="px-4 mb-3" entering={FadeInDown.delay(80).duration(400).springify()}>
          <Card>
            <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Location
            </Text>
            <View className="flex-row items-start gap-2 mb-3">
              <MapPin size={16} color="#64748b" className="mt-0.5" />
              <Text className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                {address}
              </Text>
            </View>
            {job.property.accessNotes && (
              <Text className="text-xs text-slate-500 mb-3">
                Access: {job.property.accessNotes}
              </Text>
            )}
            <View className="flex-row items-center gap-3">
              <NavigateButton
                address={address}
                latitude={job.property.latitude}
                longitude={job.property.longitude}
              />
              <DistanceBadge
                latitude={job.property.latitude}
                longitude={job.property.longitude}
              />
            </View>
          </Card>
        </Animated.View>

        {/* Line Items */}
        <Animated.View className="px-4 mb-3" entering={FadeInDown.delay(160).duration(400).springify()}>
          <Card>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Line Items
              </Text>
              <View className="flex-row items-center gap-1">
                <DollarSign size={14} color="#64748b" />
                <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(lineItemTotal)}
                </Text>
              </View>
            </View>
            {job.lineItems.length > 0 ? (
              job.lineItems.map((item) => (
                <View
                  key={item.id}
                  className="flex-row items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800"
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-sm text-slate-900 dark:text-white" numberOfLines={1}>
                      {item.description}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </Text>
                  </View>
                  <Text className="text-sm font-medium text-slate-900 dark:text-white">
                    {formatCurrency(item.total)}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-sm text-slate-400 italic">No line items yet</Text>
            )}
          </Card>
        </Animated.View>

        {/* Notes */}
        <View className="px-4 mb-3">
          <Card>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Notes ({job.notes.length})
              </Text>
              <Pressable
                onPress={() => setShowNoteInput(!showNoteInput)}
                className="flex-row items-center gap-1"
              >
                <Plus size={14} color="#3b82f6" />
                <Text className="text-sm font-medium text-blue-600">Add</Text>
              </Pressable>
            </View>

            {/* Add note input */}
            {showNoteInput && (
              <View className="mb-3 gap-2">
                <TextInput
                  value={noteText}
                  onChangeText={setNoteText}
                  placeholder="Write a note..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white min-h-[80px]"
                  textAlignVertical="top"
                />
                <View className="flex-row justify-end gap-2">
                  <Button
                    title="Cancel"
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      setShowNoteInput(false);
                      setNoteText("");
                    }}
                  />
                  <Button
                    title="Save"
                    size="sm"
                    onPress={handleAddNote}
                    loading={addNote.isPending}
                    disabled={!noteText.trim()}
                    icon={<Send size={14} color="#fff" />}
                  />
                </View>
              </View>
            )}

            {/* Notes list */}
            {job.notes.length > 0 ? (
              job.notes.map((note) => (
                <View
                  key={note.id}
                  className="py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <View className="flex-row items-center gap-2 mb-1">
                    <MessageSquare size={12} color="#64748b" />
                    <Text className="text-xs font-medium text-slate-500">
                      {note.user
                        ? `${note.user.firstName} ${note.user.lastName}`
                        : "Team"
                      }
                    </Text>
                    <Text className="text-xs text-slate-400">
                      {formatRelativeTime(note.createdAt)}
                    </Text>
                    {note.isInternal && (
                      <Badge label="Internal" bgClass="bg-slate-100" textClass="text-slate-500" />
                    )}
                  </View>
                  <Text className="text-sm text-slate-700 dark:text-slate-300">
                    {note.content}
                  </Text>
                </View>
              ))
            ) : (
              !showNoteInput && (
                <Text className="text-sm text-slate-400 italic">No notes yet</Text>
              )
            )}
          </Card>
        </View>

        {/* Photos */}
        <View className="px-4 mb-3">
          <Card>
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Photos
                </Text>
                {job.photos.length > 0 && (
                  <Badge
                    label={String(job.photos.length)}
                    bgClass="bg-blue-100"
                    textClass="text-blue-700"
                    size="sm"
                  />
                )}
              </View>
              <PhotoCapture jobId={job.id} />
            </View>
            <PhotoGrid photos={job.photos} jobId={job.id} />
          </Card>
        </View>

        {/* Signatures */}
        <View className="px-4 mb-3">
          <Card>
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Signatures
                </Text>
                {job.signatures.length > 0 && (
                  <Badge
                    label={String(job.signatures.length)}
                    bgClass="bg-emerald-100"
                    textClass="text-emerald-700"
                    size="sm"
                  />
                )}
              </View>
              <Button
                title="Capture"
                variant="outline"
                size="sm"
                onPress={() => setShowSignatureModal(true)}
                icon={<PenTool size={14} color="#3b82f6" />}
              />
            </View>
            <SignatureList signatures={job.signatures} />
          </Card>
        </View>

        {/* Description */}
        {job.description && (
          <View className="px-4 mb-3">
            <Card>
              <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Description
              </Text>
              <Text className="text-sm text-slate-700 dark:text-slate-300">
                {job.description}
              </Text>
            </Card>
          </View>
        )}

        {/* Additional status transitions */}
        {VALID_TRANSITIONS[job.status].length > 0 && (
          <View className="px-4 mb-3">
            <Card>
              <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                Change Status
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {VALID_TRANSITIONS[job.status]
                  .filter((s) => s !== primaryAction?.status)
                  .map((status) => (
                    <Pressable
                      key={status}
                      onPress={() => handleStatusChange(status as JobStatus)}
                      className="flex-row items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 active:bg-slate-50 dark:active:bg-slate-800"
                    >
                      <Text className="text-sm text-slate-600 dark:text-slate-400">
                        {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </Text>
                      <ChevronRight size={14} color="#94a3b8" />
                    </Pressable>
                  ))}
              </View>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      {primaryAction && (
        <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 pb-8">
          <Pressable
            onPress={() => handleStatusChange(primaryAction.status)}
            disabled={updateStatus.isPending}
            className={`flex-row items-center justify-center py-4 rounded-2xl ${primaryAction.color} active:opacity-90`}
          >
            <Text className="text-lg font-bold text-white">
              {updateStatus.isPending ? "Updating..." : primaryAction.label}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Signature Modal */}
      <SignatureModal
        jobId={job.id}
        visible={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
      />
    </View>
  );
}
