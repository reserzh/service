import { View, Text, Pressable, useColorScheme } from "react-native";
import { Clock, MapPin } from "lucide-react-native";
import { JobStatusBadge } from "./JobStatusBadge";
import { JobPriorityBadge } from "./JobPriorityBadge";
import { formatTimeRange } from "@/lib/format";
import type { Job } from "@/types/models";

interface JobCardProps {
  job: Job & {
    customerFirstName?: string;
    customerLastName?: string;
    propertyCity?: string;
    propertyState?: string;
  };
  onPress: () => void;
}

// Signal design — warm cards with orange top border, bold text, high contrast
export function JobCard({ job, onPress }: JobCardProps) {
  const isDark = useColorScheme() === "dark";
  const accent = isDark ? "#FB923C" : "#EA580C";
  const customerName = job.customerFirstName
    ? `${job.customerFirstName} ${job.customerLastName}`
    : "";

  const location =
    job.propertyCity && job.propertyState
      ? `${job.propertyCity}, ${job.propertyState}`
      : "";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${job.summary}, status: ${job.status}`}
      className="bg-white dark:bg-stone-800 rounded-xl p-4 active:scale-[0.98]"
      style={{
        borderTopWidth: 3,
        borderTopColor: accent,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Top row: job type + badges */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
          {job.jobNumber} · {job.jobType}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <JobPriorityBadge priority={job.priority} />
          <JobStatusBadge status={job.status} />
        </View>
      </View>

      {/* Summary */}
      <Text className="text-lg font-heading font-bold text-stone-900 dark:text-stone-50 mb-1" numberOfLines={2}>
        {job.summary}
      </Text>

      {/* Customer name */}
      {customerName ? (
        <Text className="text-base font-semibold text-stone-600 dark:text-stone-400 mb-2">
          {customerName}
        </Text>
      ) : null}

      {/* Bottom row: time + location */}
      <View className="flex-row items-center gap-4">
        {job.scheduledStart && (
          <View className="flex-row items-center gap-1">
            <Clock size={18} color={accent} />
            <Text className="text-sm font-bold text-orange-600 dark:text-orange-400">
              {formatTimeRange(job.scheduledStart, job.scheduledEnd)}
            </Text>
          </View>
        )}
        {location ? (
          <View className="flex-row items-center gap-1">
            <MapPin size={18} color="#78716C" />
            <Text className="text-sm font-semibold text-stone-500 dark:text-stone-400">
              {location}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
