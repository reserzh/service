import { View, Text, type AccessibilityRole } from "react-native";

interface BadgeProps {
  label: string;
  bgClass?: string;
  textClass?: string;
  dotClass?: string;
  showDot?: boolean;
  size?: "sm" | "md";
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
}

// Signal design — bolder badges with rounded-lg and heavier font
export function Badge({
  label,
  bgClass = "bg-stone-100 dark:bg-stone-800",
  textClass = "text-stone-700 dark:text-stone-300",
  dotClass = "bg-stone-400",
  showDot = false,
  size = "sm",
  accessibilityLabel,
  accessibilityRole,
}: BadgeProps) {
  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-lg ${bgClass} ${
        size === "sm" ? "px-3 py-1" : "px-4 py-1.5"
      }`}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
    >
      {showDot && <View className={`w-2 h-2 rounded-full ${dotClass}`} />}
      <Text
        className={`font-extrabold tracking-wide ${textClass} ${
          size === "sm" ? "text-xs" : "text-sm"
        }`}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}
