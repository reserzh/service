import { View, Text, Pressable } from "react-native";
import { Play, Square, Clock } from "lucide-react-native";
import { useState, useEffect, useCallback } from "react";
import * as Haptics from "expo-haptics";

interface TimeTrackerProps {
  actualStart: string | null;
  actualEnd: string | null;
  onStart: () => void;
  onStop: () => void;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function TimeTracker({
  actualStart,
  actualEnd,
  onStart,
  onStop,
}: TimeTrackerProps) {
  const [elapsed, setElapsed] = useState(0);
  const isRunning = !!actualStart && !actualEnd;

  const computeElapsed = useCallback(() => {
    if (!actualStart) return 0;
    const start = new Date(actualStart).getTime();
    const end = actualEnd ? new Date(actualEnd).getTime() : Date.now();
    return Math.max(0, end - start);
  }, [actualStart, actualEnd]);

  useEffect(() => {
    setElapsed(computeElapsed());

    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsed(computeElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, computeElapsed]);

  return (
    <View className="flex-row items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
      <View className="flex-row items-center gap-2">
        <Clock size={18} color={isRunning ? "#f59e0b" : "#64748b"} />
        <View>
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            {isRunning ? "Time Elapsed" : actualEnd ? "Total Time" : "Not Started"}
          </Text>
          <Text
            className={`text-lg font-mono font-bold ${
              isRunning
                ? "text-amber-600 dark:text-amber-400"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {actualStart ? formatElapsed(elapsed) : "--:--"}
          </Text>
        </View>
      </View>

      {!actualEnd && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            isRunning ? onStop() : onStart();
          }}
          className={`flex-row items-center gap-2 rounded-xl px-4 py-2.5 ${
            isRunning
              ? "bg-red-100 dark:bg-red-900 active:bg-red-200"
              : "bg-emerald-100 dark:bg-emerald-900 active:bg-emerald-200"
          }`}
          accessibilityLabel={isRunning ? "Stop timer" : "Start timer"}
          accessibilityRole="button"
        >
          {isRunning ? (
            <>
              <Square size={16} color="#ef4444" />
              <Text className="text-sm font-semibold text-red-700 dark:text-red-400">
                Stop
              </Text>
            </>
          ) : (
            <>
              <Play size={16} color="#10b981" />
              <Text className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                Start
              </Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}
