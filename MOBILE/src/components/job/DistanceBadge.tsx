import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import * as Location from "expo-location";
import { Navigation } from "lucide-react-native";

interface DistanceBadgeProps {
  latitude: string | null;
  longitude: string | null;
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Haversine formula - returns distance in miles
  const R = 3958.8; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function DistanceBadge({ latitude, longitude }: DistanceBadgeProps) {
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || cancelled) return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (cancelled) return;

      const dist = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        parseFloat(latitude),
        parseFloat(longitude)
      );

      setDistance(dist);
    })();

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  if (!latitude || !longitude || distance === null) return null;

  const label = distance < 0.1
    ? "< 0.1 mi"
    : distance < 10
      ? `${distance.toFixed(1)} mi`
      : `${Math.round(distance)} mi`;

  return (
    <View className="flex-row items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg">
      <Navigation size={12} color="#64748b" />
      <Text className="text-xs font-medium text-slate-600 dark:text-slate-400">
        {label} away
      </Text>
    </View>
  );
}
