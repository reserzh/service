import { View, Text } from "react-native";

interface BadgeProps {
  label: string;
  bgClass?: string;
  textClass?: string;
  dotClass?: string;
  showDot?: boolean;
  size?: "sm" | "md";
}

export function Badge({
  label,
  bgClass = "bg-slate-100",
  textClass = "text-slate-700",
  dotClass = "bg-slate-400",
  showDot = false,
  size = "sm",
}: BadgeProps) {
  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full ${bgClass} ${
        size === "sm" ? "px-2.5 py-0.5" : "px-3 py-1"
      }`}
    >
      {showDot && <View className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />}
      <Text
        className={`font-medium ${textClass} ${
          size === "sm" ? "text-xs" : "text-sm"
        }`}
      >
        {label}
      </Text>
    </View>
  );
}
