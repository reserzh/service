import { View, Text, Pressable, Linking } from "react-native";
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
  // Sets status to en_route + starts location tracking + opens Maps — all in one tap
  const handleGo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Capture GPS
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

      // Determine next status - skip confirmations for forward transitions
      let nextStatus: JobStatus = "en_route";
      if (job.status === "scheduled") {
        // Need to go through dispatched first, but do it silently
        await updateStatus.mutateAsync({ id: job.id, status: "dispatched" as JobStatus });
      } else if (job.status === "en_route") {
        nextStatus = "in_progress";
      } else if (job.status === "in_progress") {
        // Already working, just navigate
        navigateToJob();
        return;
      }

      await updateStatus.mutateAsync({ id: job.id, status: nextStatus, coords });

      // Start location tracking for en_route
      if (nextStatus === "en_route") {
        await startLocationTracking(job.id);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Open Maps navigation
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
        <Text className="text-sm text-slate-500 dark:text-slate-400 mb-2">
          {formatTimeRange(job.scheduledStart, job.scheduledEnd)}
        </Text>
      )}

      {/* Property Access Info — gate codes, obstacles */}
      {propertyInfo && (propertyInfo.gateCode || (propertyInfo.obstacles && propertyInfo.obstacles.length > 0)) && (
        <View className="bg-amber-100/60 dark:bg-amber-900/30 rounded-lg px-3 py-2 mb-3">
          {propertyInfo.gateCode && (
            <View className="flex-row items-center gap-1.5 mb-0.5">
              <Key size={12} color="#d97706" />
              <Text className="text-xs font-medium text-amber-800 dark:text-amber-300">
                Gate: {propertyInfo.gateCode}
              </Text>
            </View>
          )}
          {propertyInfo.obstacles && propertyInfo.obstacles.length > 0 && (
            <View className="flex-row items-center gap-1.5">
              <AlertTriangle size={12} color="#d97706" />
              <Text className="text-xs text-amber-700 dark:text-amber-400">
                {propertyInfo.obstacles.join(", ")}
              </Text>
            </View>
          )}
        </View>
      )}

      <View className="flex-row items-center gap-2">
        {/* GO button — one tap dispatch + navigate */}
        {showGoButton && (
          <Pressable
            onPress={handleGo}
            disabled={updateStatus.isPending}
            className="flex-row items-center gap-1.5 bg-emerald-600 rounded-xl px-5 py-3 active:bg-emerald-700"
            style={{ minHeight: 48 }}
            accessibilityLabel="Go to job — updates status and opens navigation"
            accessibilityRole="button"
          >
            <Navigation size={16} color="#ffffff" />
            <Text className="text-base font-bold text-white">
              {updateStatus.isPending ? "..." : "GO"}
            </Text>
          </Pressable>
        )}

        {!showGoButton && (
          <Pressable
            onPress={() => router.push(`/(tabs)/jobs/${job.id}`)}
            className="flex-row items-center gap-1.5 bg-blue-600 rounded-xl px-4 py-3 active:bg-blue-700"
            style={{ minHeight: 48 }}
            accessibilityLabel="Open job details"
            accessibilityRole="button"
          >
            <MapPin size={14} color="#ffffff" />
            <Text className="text-sm font-semibold text-white">Open</Text>
          </Pressable>
        )}

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
