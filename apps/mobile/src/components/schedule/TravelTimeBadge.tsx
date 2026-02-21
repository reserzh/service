import { View, Text } from "react-native";
import { Car } from "lucide-react-native";
import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { estimateTravelMinutes, formatTravelTime } from "@/lib/travelTime";

interface TravelTimeBadgeProps {
  latitude: string | null;
  longitude: string | null;
}

export function TravelTimeBadge({ latitude, longitude }: TravelTimeBadgeProps) {
  const [travelTime, setTravelTime] = useState<string | null>(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted") return;

        const location = await Location.getLastKnownPositionAsync();
        if (!location || cancelled) return;

        const minutes = estimateTravelMinutes(
          location.coords.latitude,
          location.coords.longitude,
          parseFloat(latitude),
          parseFloat(longitude)
        );

        if (!cancelled) {
          setTravelTime(formatTravelTime(minutes));
        }
      } catch {
        // silently fail
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  if (!travelTime) return null;

  return (
    <View className="flex-row items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-full px-2.5 py-1">
      <Car size={12} color="#64748b" />
      <Text className="text-xs text-slate-600 dark:text-slate-400">
        {travelTime}
      </Text>
    </View>
  );
}
