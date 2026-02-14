import { Pressable, Text, ActivityIndicator, type ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

const variantClasses = {
  primary: "bg-blue-600 active:bg-blue-700",
  secondary: "bg-slate-800 active:bg-slate-900",
  outline: "border border-slate-300 bg-transparent active:bg-slate-50 dark:border-slate-600 dark:active:bg-slate-800",
  ghost: "bg-transparent active:bg-slate-100 dark:active:bg-slate-800",
  danger: "bg-red-600 active:bg-red-700",
};

const textVariantClasses = {
  primary: "text-white",
  secondary: "text-white",
  outline: "text-slate-900 dark:text-slate-100",
  ghost: "text-slate-900 dark:text-slate-100",
  danger: "text-white",
};

const sizeClasses = {
  sm: "px-3 py-1.5 rounded-lg",
  md: "px-4 py-2.5 rounded-xl",
  lg: "px-6 py-3.5 rounded-xl",
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  className = "",
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (!isDisabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center gap-2 ${variantClasses[variant]} ${sizeClasses[size]} ${isDisabled ? "opacity-50" : ""} ${className}`}
      style={style}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" || variant === "ghost" ? "#374151" : "#ffffff"}
        />
      ) : (
        <>
          {icon}
          <Text
            className={`font-semibold ${textVariantClasses[variant]} ${textSizeClasses[size]}`}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
