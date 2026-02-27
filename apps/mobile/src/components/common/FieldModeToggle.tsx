import { Pressable } from "react-native";
import { Sun, SunDim } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSettingsStore } from "@/stores/settings";

interface FieldModeToggleProps {
  /** Size of the icon */
  size?: number;
}

/**
 * Quick toggle button for field mode.
 * Shows a sun icon — filled/bright when field mode is on.
 */
export function FieldModeToggle({ size = 22 }: FieldModeToggleProps) {
  const fieldMode = useSettingsStore((s) => s.fieldMode);
  const setFieldMode = useSettingsStore((s) => s.setFieldMode);

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFieldMode(!fieldMode);
  };

  return (
    <Pressable
      onPress={toggle}
      hitSlop={12}
      className={`items-center justify-center rounded-full ${
        fieldMode
          ? "bg-orange-500 w-9 h-9"
          : "bg-slate-100 dark:bg-slate-800 w-9 h-9"
      }`}
      accessibilityLabel={fieldMode ? "Disable field mode" : "Enable field mode"}
      accessibilityRole="switch"
      accessibilityState={{ checked: fieldMode }}
    >
      {fieldMode ? (
        <Sun size={size} color="#fff" />
      ) : (
        <SunDim size={size} color="#94a3b8" />
      )}
    </Pressable>
  );
}
