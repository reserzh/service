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
    <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
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
                className={`text-base font-semibold ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
        <Animated.View
          className="absolute bottom-0 h-1 bg-blue-600 dark:bg-blue-400"
          style={[{ width: "25%" }, underlineStyle]}
        />
      </View>
    </View>
  );
}
