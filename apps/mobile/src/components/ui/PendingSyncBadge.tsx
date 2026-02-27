import { View, Text } from "react-native";
import { Clock } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

interface PendingSyncBadgeProps {
  /** Number of pending items; badge hidden when 0 */
  count?: number;
  /** Show as compact dot (no count) */
  compact?: boolean;
}

export function PendingSyncBadge({ count = 0, compact = false }: PendingSyncBadgeProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (count > 0) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1, // infinite
        true
      );
    } else {
      opacity.value = 1;
    }
  }, [count, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (count <= 0) return null;

  if (compact) {
    return (
      <Animated.View
        style={animatedStyle}
        className="w-2.5 h-2.5 rounded-full bg-amber-500 absolute -top-0.5 -right-0.5"
      />
    );
  }

  return (
    <Animated.View
      style={animatedStyle}
      className="flex-row items-center gap-1 bg-amber-100 dark:bg-amber-900 rounded-full px-2 py-0.5"
    >
      <Clock size={10} color="#f59e0b" />
      <Text className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
        {count}
      </Text>
    </Animated.View>
  );
}
