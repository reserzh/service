import { View, Text, Pressable, Linking } from "react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Navigation,
  Phone,
  Play,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Card } from "@/components/ui/Card";
import { JobStatusBadge } from "@/components/job/JobStatusBadge";
import { formatTimeRange } from "@/lib/format";
import type { Job } from "@/types/models";

interface NextJobCardProps {
  job: Job & {
    customerFirstName?: string;
    customerLastName?: string;
    customerPhone?: string;
    propertyCity?: string;
    propertyState?: string;
  };
}

export function NextJobCard({ job }: NextJobCardProps) {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!job.scheduledStart) return;

    const update = () => {
      const now = new Date();
      const start = new Date(job.scheduledStart!);
      const diffMs = start.getTime() - now.getTime();

      if (diffMs <= 0) {
        setCountdown("Now");
        return;
      }

      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 60) {
        setCountdown(`Starts in ${diffMin} min`);
      } else {
        const hours = Math.floor(diffMin / 60);
        const mins = diffMin % 60;
        setCountdown(`Starts in ${hours}h ${mins}m`);
      }
    };

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [job.scheduledStart]);

  const customerName = job.customerFirstName
    ? `${job.customerFirstName} ${job.customerLastName}`
    : "";

  const handleCall = () => {
    if (job.customerPhone) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(`tel:${job.customerPhone}`);
    }
  };

  return (
    <Card
      onPress={() => router.push(`/(tabs)/jobs/${job.id}`)}
      className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950"
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full bg-blue-500" />
          <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            Next Job
          </Text>
        </View>
        {countdown ? (
          <View className="flex-row items-center gap-1 bg-blue-100 dark:bg-blue-900 rounded-full px-2.5 py-0.5">
            <Clock size={12} color="#3b82f6" />
            <Text className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {countdown}
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        className="text-lg font-semibold text-slate-900 dark:text-white mb-1"
        numberOfLines={1}
      >
        {job.summary}
      </Text>

      {customerName ? (
        <Text className="text-base text-slate-600 dark:text-slate-400 mb-1">
          {customerName}
        </Text>
      ) : null}

      {job.scheduledStart && (
        <Text className="text-sm text-slate-500 dark:text-slate-400 mb-3">
          {formatTimeRange(job.scheduledStart, job.scheduledEnd)}
        </Text>
      )}

      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/(tabs)/jobs/${job.id}`);
          }}
          className="flex-row items-center gap-1.5 bg-blue-600 rounded-xl px-4 py-3 active:bg-blue-700"
          style={{ minHeight: 48 }}
          accessibilityLabel="Navigate to job location"
          accessibilityRole="button"
        >
          <Navigation size={14} color="#ffffff" />
          <Text className="text-sm font-semibold text-white">Navigate</Text>
        </Pressable>

        {job.customerPhone && (
          <Pressable
            onPress={handleCall}
            className="flex-row items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900 rounded-xl px-4 py-3 active:bg-emerald-200"
            style={{ minHeight: 48 }}
            accessibilityLabel="Call customer"
            accessibilityRole="button"
          >
            <Phone size={14} color="#10b981" />
            <Text className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              Call
            </Text>
          </Pressable>
        )}

        <View className="flex-1" />

        <JobStatusBadge status={job.status} />
      </View>
    </Card>
  );
}
