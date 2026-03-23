import { View, Text, Pressable, useColorScheme } from "react-native";
import { useState, useEffect } from "react";
import { Clock, Coffee, LogOut } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Card } from "@/components/ui/Card";
import { useTimeTrackingStore } from "@/stores/timeTracking";
import { ClockOutPrompt } from "./ClockOutPrompt";

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Signal design — orange clock-in, warm stone card, bold typography
export function ClockWidget() {
  const { status, clockInTime, clockIn, clockOut, startBreak, endBreak } =
    useTimeTrackingStore();
  const [elapsed, setElapsed] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const isDark = useColorScheme() === "dark";

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

  const handleClockOut = () => {
    setShowPrompt(true);
  };

  const doClockOut = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    clockOut();
  };

  if (status === "clocked_out") {
    return (
      <Pressable
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          clockIn();
        }}
        className="bg-orange-600 dark:bg-orange-500 rounded-xl active:bg-orange-700 p-5"
        style={{ minHeight: 64 }}
        accessibilityLabel="Clock in"
        accessibilityRole="button"
      >
        <View className="flex-row items-center gap-3">
          <View className="rounded-full bg-orange-500 dark:bg-orange-400 items-center justify-center w-14 h-14">
            <Clock size={28} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-extrabold text-xl tracking-wide">
              Clock In
            </Text>
            <Text className="text-orange-200 dark:text-orange-100 text-sm font-semibold">
              Start your shift
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <>
      <Card accent>
        <View className="flex-row items-center gap-3 mb-3">
          <View
            className={`rounded-full items-center justify-center w-14 h-14 ${
              status === "on_break"
                ? "bg-amber-100 dark:bg-amber-900"
                : "bg-emerald-100 dark:bg-emerald-900"
            }`}
          >
            {status === "on_break" ? (
              <Coffee size={28} color="#f59e0b" />
            ) : (
              <Clock size={28} color="#16a34a" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-stone-500 dark:text-stone-400 text-sm font-bold">
              {status === "on_break" ? "On Break" : "Clocked In"}
            </Text>
            <Text className="font-heading-bold text-stone-900 dark:text-stone-50 text-3xl">
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
              className="flex-1 flex-row items-center justify-center gap-2 bg-amber-50 dark:bg-amber-950 rounded-xl active:bg-amber-100 py-4"
              style={{ minHeight: 56 }}
              accessibilityLabel="Start break"
              accessibilityRole="button"
            >
              <Coffee size={22} color="#f59e0b" />
              <Text className="font-bold text-amber-700 dark:text-amber-400 text-base">
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
              className="flex-1 flex-row items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-950 rounded-xl active:bg-emerald-100 py-4"
              style={{ minHeight: 56 }}
              accessibilityLabel="End break"
              accessibilityRole="button"
            >
              <Clock size={22} color="#16a34a" />
              <Text className="font-bold text-emerald-700 dark:text-emerald-400 text-base">
                Resume
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={handleClockOut}
            className="flex-1 flex-row items-center justify-center gap-2 bg-red-50 dark:bg-red-950 rounded-xl active:bg-red-100 py-4"
            style={{ minHeight: 56 }}
            accessibilityLabel="Clock out"
            accessibilityRole="button"
          >
            <LogOut size={22} color="#ef4444" />
            <Text className="font-bold text-red-700 dark:text-red-400 text-base">
              Clock Out
            </Text>
          </Pressable>
        </View>
      </Card>

      {/* End-of-day prompt */}
      <ClockOutPrompt
        visible={showPrompt}
        onSkip={() => {
          setShowPrompt(false);
          doClockOut();
        }}
        onSubmitted={() => {
          setShowPrompt(false);
          doClockOut();
        }}
      />
    </>
  );
}
