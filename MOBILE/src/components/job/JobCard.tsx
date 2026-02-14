import { View, Text, Pressable } from "react-native";
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

export function JobCard({ job, onPress }: JobCardProps) {
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
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 active:scale-[0.98]"
    >
      {/* Top row: job type + badges */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {job.jobNumber} · {job.jobType}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <JobPriorityBadge priority={job.priority} />
          <JobStatusBadge status={job.status} />
        </View>
      </View>

      {/* Summary */}
      <Text className="text-base font-semibold text-slate-900 dark:text-white mb-1" numberOfLines={2}>
        {job.summary}
      </Text>

      {/* Customer name */}
      {customerName ? (
        <Text className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          {customerName}
        </Text>
      ) : null}

      {/* Bottom row: time + location */}
      <View className="flex-row items-center gap-4">
        {job.scheduledStart && (
          <View className="flex-row items-center gap-1">
            <Clock size={14} color="#64748b" />
            <Text className="text-xs text-slate-500 dark:text-slate-400">
              {formatTimeRange(job.scheduledStart, job.scheduledEnd)}
            </Text>
          </View>
        )}
        {location ? (
          <View className="flex-row items-center gap-1">
            <MapPin size={14} color="#64748b" />
            <Text className="text-xs text-slate-500 dark:text-slate-400">
              {location}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
