import { Pressable, Text, Linking, Platform } from "react-native";
import { Navigation } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface NavigateButtonProps {
  address: string;
  latitude?: string | null;
  longitude?: string | null;
  size?: "sm" | "md";
}

export function NavigateButton({ address, latitude, longitude, size = "md" }: NavigateButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let url: string;

    if (latitude && longitude) {
      // Use coordinates for more accurate navigation
      if (Platform.OS === "ios") {
        url = `maps://app?daddr=${latitude},${longitude}`;
      } else {
        url = `google.navigation:q=${latitude},${longitude}`;
      }
    } else {
      // Fall back to address
      const encoded = encodeURIComponent(address);
      if (Platform.OS === "ios") {
        url = `maps://app?daddr=${encoded}`;
      } else {
        url = `google.navigation:q=${encoded}`;
      }
    }

    Linking.openURL(url).catch(() => {
      // Fallback to Google Maps web
      const encoded = encodeURIComponent(address);
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`);
    });
  };

  if (size === "sm") {
    return (
      <Pressable
        onPress={handlePress}
        className="flex-row items-center gap-1 bg-blue-50 dark:bg-blue-950 px-3 py-1.5 rounded-lg active:bg-blue-100 dark:active:bg-blue-900"
      >
        <Navigation size={14} color="#3b82f6" />
        <Text className="text-xs font-medium text-blue-600 dark:text-blue-400">Navigate</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center justify-center gap-2 bg-blue-600 px-4 py-3 rounded-xl active:bg-blue-700"
    >
      <Navigation size={18} color="#ffffff" />
      <Text className="text-base font-semibold text-white">Navigate</Text>
    </Pressable>
  );
}
