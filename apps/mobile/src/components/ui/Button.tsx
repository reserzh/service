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

// Signal design — high-visibility buttons with orange accent
const variantClasses = {
  primary: "bg-orange-600 active:bg-orange-700",
  secondary: "bg-stone-800 dark:bg-stone-700 active:bg-stone-900",
  outline: "border-2 border-orange-600 dark:border-orange-400 bg-transparent active:bg-orange-50 dark:active:bg-stone-800",
  ghost: "bg-transparent active:bg-stone-100 dark:active:bg-stone-800",
  danger: "bg-red-600 active:bg-red-700",
};

const textVariantClasses = {
  primary: "text-white",
  secondary: "text-white",
  outline: "text-orange-600 dark:text-orange-400",
  ghost: "text-stone-900 dark:text-stone-100",
  danger: "text-white",
};

const sizeClasses = {
  sm: "px-5 py-3 rounded-xl",
  md: "px-6 py-4 rounded-xl",
  lg: "px-8 py-5 rounded-xl",
};

const sizeMinHeights = {
  sm: 48,
  md: 52,
  lg: 56,
};

const textSizeClasses = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
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
      className={`flex-row items-center justify-center gap-2 active:scale-[0.96] ${variantClasses[variant]} ${sizeClasses[size]} ${isDisabled ? "opacity-50" : ""} ${className}`}
      style={[{ minHeight: sizeMinHeights[size] }, style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" || variant === "ghost" ? "#EA580C" : "#ffffff"}
        />
      ) : (
        <>
          {icon}
          <Text
            className={`font-extrabold tracking-wide ${textVariantClasses[variant]} ${textSizeClasses[size]}`}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
