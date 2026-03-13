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
        size === "sm" ? "px-3 py-1" : "px-4 py-1.5"
      }`}
    >
      {showDot && <View className={`w-2 h-2 rounded-full ${dotClass}`} />}
      <Text
        className={`font-medium ${textClass} ${
          size === "sm" ? "text-sm" : "text-base"
        }`}
      >
        {label}
      </Text>
    </View>
  );
}
