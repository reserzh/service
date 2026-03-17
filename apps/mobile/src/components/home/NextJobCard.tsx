import { View, Text, Pressable, Linking, useColorScheme } from "react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Navigation,
  Phone,
  Clock,
  MapPin,
  Key,
  AlertTriangle,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { JobStatusBadge } from "@/components/job/JobStatusBadge";
import { formatTimeRange } from "@/lib/format";
import { startLocationTracking } from "@/lib/locationTracking";
import { useUpdateJobStatus } from "@/hooks/useJobs";
import { propertiesApi } from "@/api/endpoints/properties";
import type { Job, JobStatus } from "@/types/models";

interface NextJobCardProps {
  job: Job & {
    customerFirstName?: string;
    customerLastName?: string;
    customerPhone?: string;
    propertyId?: string;
    propertyCity?: string;
    propertyState?: string;
    propertyAddress?: string;
  };
}

export function NextJobCard({ job }: NextJobCardProps) {
  const [countdown, setCountdown] = useState("");
  const updateStatus = useUpdateJobStatus();
  const isDark = useColorScheme() === "dark";
  const accent = isDark ? "#FB923C" : "#EA580C";

  // Fetch property history for access info
  const { data: historyData } = useQuery({
    queryKey: ["property-history", job.propertyId],
    queryFn: () => propertiesApi.getHistory(job.propertyId!, 1),
    enabled: !!job.propertyId,
    staleTime: 10 * 60 * 1000,
  });

  const propertyInfo = historyData?.data?.property;

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

  // Phase 1B: One-Tap GO button
  const handleGo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let coords: { latitude: number; longitude: number } | undefined;
      try {
        const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
        if (permStatus === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        }
      } catch {
        // GPS is best-effort
      }

      let nextStatus: JobStatus = "en_route";
      if (job.status === "scheduled") {
        await updateStatus.mutateAsync({ id: job.id, status: "dispatched" as JobStatus });
      } else if (job.status === "en_route") {
        nextStatus = "in_progress";
      } else if (job.status === "in_progress") {
        navigateToJob();
        return;
      }

      await updateStatus.mutateAsync({ id: job.id, status: nextStatus, coords });

      if (nextStatus === "en_route") {
        await startLocationTracking(job.id);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigateToJob();
      Toast.show({ type: "success", text1: nextStatus === "en_route" ? "On your way!" : "Job started" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      Toast.show({ type: "error", text1: "Error", text2: msg });
    }
  };

  const navigateToJob = () => {
    const address = job.propertyAddress
      ? `${job.propertyAddress}, ${job.propertyCity ?? ""}`
      : job.propertyCity ?? "";

    if (address) {
      const encoded = encodeURIComponent(address);
      Linking.openURL(`maps://app?daddr=${encoded}`).catch(() => {
        Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${encoded}`
        );
      });
    }
  };

  const showGoButton = ["scheduled", "dispatched"].includes(job.status);

  return (
    <Card
      onPress={() => router.push(`/(tabs)/jobs/${job.id}`)}
      accent
      className="bg-orange-50 dark:bg-stone-800"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-2.5 h-2.5 rounded-full bg-orange-500 dark:bg-orange-400" />
          <Text className="text-xs font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-widest">
            Next Up
          </Text>
        </View>
        {countdown ? (
          <View className="flex-row items-center gap-1 bg-orange-100 dark:bg-orange-900/40 rounded-lg px-2.5 py-1">
            <Clock size={12} color={accent} />
            <Text className="text-xs font-extrabold text-orange-600 dark:text-orange-400">
              {countdown}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Job info */}
      <Text
        className="text-lg font-extrabold text-stone-900 dark:text-stone-50 mb-1"
        numberOfLines={1}
      >
        {job.summary}
      </Text>

      {customerName ? (
        <Text className="text-base font-semibold text-stone-600 dark:text-stone-400 mb-1">
          {customerName}
        </Text>
      ) : null}

      {job.scheduledStart && (
        <Text className="text-sm font-bold text-orange-600 dark:text-orange-400 mb-2">
          {formatTimeRange(job.scheduledStart, job.scheduledEnd)}
        </Text>
      )}

      {/* Property Access Info */}
      {propertyInfo && (propertyInfo.gateCode || (propertyInfo.obstacles && propertyInfo.obstacles.length > 0)) && (
        <View className="bg-amber-100/60 dark:bg-amber-900/30 rounded-lg px-3 py-2 mb-3">
          {propertyInfo.gateCode && (
            <View className="flex-row items-center gap-1.5 mb-0.5">
              <Key size={12} color="#d97706" />
              <Text className="text-xs font-bold text-amber-800 dark:text-amber-300">
                Gate: {propertyInfo.gateCode}
              </Text>
            </View>
          )}
          {propertyInfo.obstacles && propertyInfo.obstacles.length > 0 && (
            <View className="flex-row items-center gap-1.5">
              <AlertTriangle size={12} color="#d97706" />
              <Text className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                {propertyInfo.obstacles.join(", ")}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Action buttons */}
      <View className="flex-row items-center gap-2">
        {showGoButton && (
          <Pressable
            onPress={handleGo}
            disabled={updateStatus.isPending}
            className="flex-row items-center gap-2 bg-orange-600 dark:bg-orange-500 rounded-xl px-6 py-3.5 active:bg-orange-700"
            style={{ minHeight: 52 }}
            accessibilityLabel="Go to job — updates status and opens navigation"
            accessibilityRole="button"
          >
            <Navigation size={18} color="#ffffff" />
            <Text className="text-base font-extrabold text-white tracking-wide">
              {updateStatus.isPending ? "..." : "GO"}
            </Text>
          </Pressable>
        )}

        {!showGoButton && (
          <Pressable
            onPress={() => router.push(`/(tabs)/jobs/${job.id}`)}
            className="flex-row items-center gap-2 bg-orange-600 dark:bg-orange-500 rounded-xl px-5 py-3.5 active:bg-orange-700"
            style={{ minHeight: 52 }}
            accessibilityLabel="Open job details"
            accessibilityRole="button"
          >
            <MapPin size={16} color="#ffffff" />
            <Text className="text-sm font-extrabold text-white tracking-wide">Open</Text>
          </Pressable>
        )}

        {job.customerPhone && (
          <Pressable
            onPress={handleCall}
            className="flex-row items-center gap-1.5 bg-white dark:bg-stone-700 rounded-xl px-4 py-3.5 active:bg-stone-100"
            style={{
              minHeight: 52,
              borderWidth: 2,
              borderColor: isDark ? "#FB923C" : "#EA580C",
            }}
            accessibilityLabel="Call customer"
            accessibilityRole="button"
          >
            <Phone size={16} color={accent} />
            <Text className="text-sm font-extrabold text-orange-600 dark:text-orange-400">
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
