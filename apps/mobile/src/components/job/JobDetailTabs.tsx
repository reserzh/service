import { View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

export type JobTab = "overview" | "work" | "media" | "history";

const TABS: { key: JobTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "work", label: "Work" },
  { key: "media", label: "Media" },
  { key: "history", label: "History" },
];

interface JobDetailTabsProps {
  activeTab: JobTab;
  onTabChange: (tab: JobTab) => void;
}

// Signal design — orange underline, bold text, warm stone bg
export function JobDetailTabs({ activeTab, onTabChange }: JobDetailTabsProps) {
  const activeIndex = TABS.findIndex((t) => t.key === activeTab);
  const translateX = useSharedValue(activeIndex * 25);

  useEffect(() => {
    translateX.value = withTiming(activeIndex * 25, { duration: 200 });
  }, [activeIndex, translateX]);

  const underlineStyle = useAnimatedStyle(() => ({
    left: `${translateX.value}%` as unknown as number,
  }));

  return (
    <View className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
      <View className="flex-row relative">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => {
                Haptics.selectionAsync();
                onTabChange(tab.key);
              }}
              className="flex-1 items-center py-4 min-h-[56px]"
              accessibilityLabel={`${tab.label} tab`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text
                className={`text-base font-extrabold tracking-wide ${
                  isActive
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-stone-400 dark:text-stone-500"
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
        <Animated.View
          className="absolute bottom-0 h-1 bg-orange-600 dark:bg-orange-400 rounded-full"
          style={[{ width: "25%" }, underlineStyle]}
        />
      </View>
    </View>
  );
}
