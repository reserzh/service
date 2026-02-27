import { View, Text } from "react-native";
import { WifiOff, RefreshCw } from "lucide-react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useSyncStatus } from "@/hooks/useSyncStatus";

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const { pendingCount, isProcessing } = useSyncStatus();
  const insets = useSafeAreaInsets();

  // Show when offline, or when online but still processing pending items
  const showBanner = isOffline || (isProcessing && pendingCount > 0);

  if (!showBanner) return null;

  const message = isOffline
    ? pendingCount > 0
      ? `Offline — ${pendingCount} change${pendingCount !== 1 ? "s" : ""} pending`
      : "You're offline — showing cached data"
    : `Syncing ${pendingCount} change${pendingCount !== 1 ? "s" : ""}...`;

  const Icon = isProcessing && !isOffline ? RefreshCw : WifiOff;

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutUp.duration(300)}
      className="absolute left-0 right-0 z-50 flex-row items-center justify-center gap-2 bg-amber-500 py-2"
      style={{ top: insets.top }}
    >
      <Icon size={14} color="#fff" />
      <Text className="text-sm font-medium text-white">{message}</Text>
    </Animated.View>
  );
}
