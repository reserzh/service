import { Pressable, Text, Linking, Platform } from "react-native";
import { Navigation } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSettingsStore } from "@/stores/settings";
import { useSignalColors } from "@/hooks/useSignalColors";

interface NavigateButtonProps {
  address: string;
  latitude?: string | null;
  longitude?: string | null;
  size?: "sm" | "md";
}

export function NavigateButton({ address, latitude, longitude, size = "md" }: NavigateButtonProps) {
  const preferredMapApp = useSettingsStore((s) => s.preferredMapApp);
  const colors = useSignalColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const encoded = encodeURIComponent(address);
    const coords = latitude && longitude ? `${latitude},${longitude}` : null;

    let url: string;

    if (preferredMapApp === "waze") {
      url = coords
        ? `waze://?ll=${coords}&navigate=yes`
        : `waze://?q=${encoded}&navigate=yes`;
    } else if (preferredMapApp === "google") {
      url = coords
        ? `comgooglemaps://?daddr=${coords}&directionsmode=driving`
        : `comgooglemaps://?daddr=${encoded}&directionsmode=driving`;
    } else {
      // Default platform maps
      if (coords) {
        url = Platform.OS === "ios"
          ? `maps://app?daddr=${coords}`
          : `google.navigation:q=${coords}`;
      } else {
        url = Platform.OS === "ios"
          ? `maps://app?daddr=${encoded}`
          : `google.navigation:q=${encoded}`;
      }
    }

    Linking.openURL(url).catch(() => {
      // Fallback to Google Maps web
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${encoded}`
      );
    });
  };

  if (size === "sm") {
    return (
      <Pressable
        onPress={handlePress}
        className="flex-row items-center gap-1 bg-orange-50 dark:bg-orange-950 px-3 py-1.5 rounded-lg active:bg-orange-100 dark:active:bg-orange-900"
        accessibilityLabel="Navigate to location"
        accessibilityRole="button"
      >
        <Navigation size={14} color={colors.accent} />
        <Text className="text-xs font-medium text-orange-600 dark:text-orange-400">Navigate</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center justify-center gap-2 bg-orange-600 px-4 py-3 rounded-xl active:bg-orange-700"
      accessibilityLabel="Navigate to location"
      accessibilityRole="button"
    >
      <Navigation size={18} color="#ffffff" />
      <Text className="text-base font-semibold text-white">Navigate</Text>
    </Pressable>
  );
}
