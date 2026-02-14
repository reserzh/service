import { View, Pressable, type ViewStyle } from "react-native";

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  style?: ViewStyle;
}

export function Card({ children, onPress, className = "", style }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 active:scale-[0.98] ${className}`}
        style={style}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 ${className}`}
      style={style}
    >
      {children}
    </View>
  );
}
