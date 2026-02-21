import { Text } from "react-native";
import { WifiOff } from "lucide-react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  if (!isOffline) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutUp.duration(300)}
      className="absolute left-0 right-0 z-50 flex-row items-center justify-center gap-2 bg-amber-500 py-2"
      style={{ top: insets.top }}
    >
      <WifiOff size={14} color="#fff" />
      <Text className="text-sm font-medium text-white">
        You're offline — showing cached data
      </Text>
    </Animated.View>
  );
}
