import { View, Text, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { Clock, Coffee, LogOut } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Card } from "@/components/ui/Card";
import { useTimeTrackingStore } from "@/stores/timeTracking";
import { useSettingsStore } from "@/stores/settings";

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function ClockWidget() {
  const { status, clockInTime, clockIn, clockOut, startBreak, endBreak } =
    useTimeTrackingStore();
  const fieldMode = useSettingsStore((s) => s.fieldMode);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status === "clocked_out" || !clockInTime) {
      setElapsed(0);
      return;
    }

    const update = () => {
      const start = new Date(clockInTime).getTime();
      setElapsed(Date.now() - start);
    };

    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [status, clockInTime]);

  const iconCircleSize = fieldMode ? "w-14 h-14" : "w-10 h-10";
  const iconSize = fieldMode ? 28 : 20;
  const actionIconSize = fieldMode ? 22 : 16;

  if (status === "clocked_out") {
    return (
      <Pressable
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          clockIn();
        }}
        className={`bg-blue-600 rounded-2xl active:bg-blue-700 ${fieldMode ? "p-5" : "p-4"}`}
        style={fieldMode ? { minHeight: 64 } : undefined}
        accessibilityLabel="Clock in"
        accessibilityRole="button"
      >
        <View className="flex-row items-center gap-3">
          <View className={`rounded-full bg-blue-500 items-center justify-center ${iconCircleSize}`}>
            <Clock size={iconSize} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className={`text-white font-semibold ${fieldMode ? "text-xl" : "text-base"}`}>
              Clock In
            </Text>
            <Text className={`text-blue-200 ${fieldMode ? "text-sm" : "text-xs"}`}>
              Start your shift
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Card>
      <View className="flex-row items-center gap-3 mb-3">
        <View
          className={`rounded-full items-center justify-center ${iconCircleSize} ${
            status === "on_break"
              ? "bg-amber-100 dark:bg-amber-900"
              : "bg-emerald-100 dark:bg-emerald-900"
          }`}
        >
          {status === "on_break" ? (
            <Coffee size={iconSize} color="#f59e0b" />
          ) : (
            <Clock size={iconSize} color="#10b981" />
          )}
        </View>
        <View className="flex-1">
          <Text className={`text-slate-500 dark:text-slate-400 ${fieldMode ? "text-sm" : "text-xs"}`}>
            {status === "on_break" ? "On Break" : "Clocked In"}
          </Text>
          <Text className={`font-bold text-slate-900 dark:text-white ${fieldMode ? "text-2xl" : "text-lg"}`}>
            {formatDuration(elapsed)}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        {status === "clocked_in" && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              startBreak();
            }}
            className={`flex-1 flex-row items-center justify-center gap-2 bg-amber-50 dark:bg-amber-950 rounded-xl active:bg-amber-100 ${
              fieldMode ? "py-4" : "py-2.5"
            }`}
            style={fieldMode ? { minHeight: 56 } : undefined}
            accessibilityLabel="Start break"
            accessibilityRole="button"
          >
            <Coffee size={actionIconSize} color="#f59e0b" />
            <Text className={`font-medium text-amber-700 dark:text-amber-400 ${fieldMode ? "text-base" : "text-sm"}`}>
              Break
            </Text>
          </Pressable>
        )}
        {status === "on_break" && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              endBreak();
            }}
            className={`flex-1 flex-row items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-950 rounded-xl active:bg-emerald-100 ${
              fieldMode ? "py-4" : "py-2.5"
            }`}
            style={fieldMode ? { minHeight: 56 } : undefined}
            accessibilityLabel="End break"
            accessibilityRole="button"
          >
            <Clock size={actionIconSize} color="#10b981" />
            <Text className={`font-medium text-emerald-700 dark:text-emerald-400 ${fieldMode ? "text-base" : "text-sm"}`}>
              Resume
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            clockOut();
          }}
          className={`flex-1 flex-row items-center justify-center gap-2 bg-red-50 dark:bg-red-950 rounded-xl active:bg-red-100 ${
            fieldMode ? "py-4" : "py-2.5"
          }`}
          style={fieldMode ? { minHeight: 56 } : undefined}
          accessibilityLabel="Clock out"
          accessibilityRole="button"
        >
          <LogOut size={actionIconSize} color="#ef4444" />
          <Text className={`font-medium text-red-700 dark:text-red-400 ${fieldMode ? "text-base" : "text-sm"}`}>
            Clock Out
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}
