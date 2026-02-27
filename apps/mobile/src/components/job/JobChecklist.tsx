import { View, Text, Pressable } from "react-native";
import { CheckSquare, Square } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, Layout } from "react-native-reanimated";
import type { JobChecklistItem } from "@/types/models";

interface JobChecklistProps {
  items: JobChecklistItem[];
  onToggle: (itemId: string, completed: boolean) => void;
  fieldMode?: boolean;
}

export function JobChecklist({ items, onToggle, fieldMode = false }: JobChecklistProps) {
  if (items.length === 0) {
    return (
      <Text className="text-sm text-slate-400 italic">No checklist items</Text>
    );
  }

  const completedCount = items.filter((i) => i.completed).length;
  const progress = items.length > 0 ? completedCount / items.length : 0;

  const iconSize = fieldMode ? 32 : 20;

  return (
    <View>
      {/* Progress bar */}
      <View className="flex-row items-center gap-2 mb-3">
        <View className={`flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden ${fieldMode ? "h-3" : "h-2"}`}>
          <Animated.View
            className="h-full bg-emerald-500 rounded-full"
            style={{ width: `${progress * 100}%` }}
            layout={Layout.springify()}
          />
        </View>
        <Text className={`font-medium text-slate-500 ${fieldMode ? "text-sm" : "text-xs"}`}>
          {completedCount}/{items.length}
        </Text>
      </View>

      {/* Items */}
      {items.map((item) => (
        <Animated.View key={item.id} entering={FadeIn.duration(200)} layout={Layout.springify()}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggle(item.id, !item.completed);
            }}
            className={`flex-row items-center border-b border-slate-100 dark:border-slate-800 ${
              fieldMode ? "gap-4 py-4" : "gap-3 py-2.5"
            }`}
            style={fieldMode ? { minHeight: 56 } : undefined}
            accessibilityLabel={`${item.label}: ${item.completed ? "completed" : "not completed"}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.completed }}
          >
            {item.completed ? (
              <CheckSquare size={iconSize} color={fieldMode ? "#00E676" : "#10b981"} />
            ) : (
              <Square size={iconSize} color="#94a3b8" />
            )}
            <Text
              className={`flex-1 ${
                fieldMode ? "text-lg" : "text-sm"
              } ${
                item.completed
                  ? "text-slate-400 line-through"
                  : fieldMode
                    ? "text-white"
                    : "text-slate-900 dark:text-white"
              }`}
            >
              {item.label}
            </Text>
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
}
