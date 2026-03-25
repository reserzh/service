import { View, Text, Pressable } from "react-native";
import { useCallback } from "react";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { Eye, Phone, Navigation, Calendar } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Linking } from "react-native";
import { JobStatusBadge } from "@/components/job/JobStatusBadge";
import { useSignalColors } from "@/hooks/useSignalColors";
import { formatTimeRange } from "@/lib/format";
import type { Job } from "@/types/models";

interface ScheduleJobSheetProps {
  job: Job | null;
  sheetRef: React.RefObject<BottomSheet | null>;
}

export function ScheduleJobSheet({ job, sheetRef }: ScheduleJobSheetProps) {
  const colors = useSignalColors();
  const handleClose = useCallback(() => {
    sheetRef.current?.close();
  }, [sheetRef]);

  if (!job) return null;

  const actions = [
    {
      icon: <Eye size={18} color={colors.accent} />,
      label: "View Job",
      onPress: () => {
        handleClose();
        router.push(`/(tabs)/jobs/${job.id}`);
      },
    },
    {
      icon: <Navigation size={18} color="#8b5cf6" />,
      label: "Navigate",
      onPress: () => {
        handleClose();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Navigate to job location placeholder
        router.push(`/(tabs)/jobs/${job.id}`);
      },
    },
  ];

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={[280]}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: "#ffffff" }}
      handleIndicatorStyle={{ backgroundColor: "#cbd5e1" }}
    >
      <BottomSheetView className="px-4 pb-6">
        {/* Job info */}
        <View className="mb-4">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              {job.jobNumber}
            </Text>
            <JobStatusBadge status={job.status} />
          </View>
          <Text className="text-lg font-bold text-stone-900 mb-1" numberOfLines={1}>
            {job.summary}
          </Text>
          {job.scheduledStart && (
            <Text className="text-sm text-stone-500">
              {formatTimeRange(job.scheduledStart, job.scheduledEnd)}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View className="gap-2">
          {actions.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                action.onPress();
              }}
              className="flex-row items-center gap-3 bg-stone-50 rounded-xl px-4 py-3 active:bg-stone-100"
              accessibilityLabel={action.label}
              accessibilityRole="button"
            >
              {action.icon}
              <Text className="text-base font-medium text-stone-900">
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
