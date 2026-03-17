import { View, Pressable, type ViewStyle } from "react-native";

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  style?: ViewStyle;
  /** Show the Signal orange top accent border */
  accent?: boolean;
}

// Signal design — warm cards with optional orange top border
const baseClasses = "bg-white dark:bg-stone-800 rounded-xl p-4";
const shadowStyle: ViewStyle = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3,
};

const accentStyle: ViewStyle = {
  borderTopWidth: 3,
  borderTopColor: "#EA580C",
};

export function Card({ children, onPress, className = "", style, accent = false }: CardProps) {
  const combinedStyle: ViewStyle[] = [
    shadowStyle,
    accent ? accentStyle : {},
    style ?? {},
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`${baseClasses} active:scale-[0.98] ${className}`}
        style={combinedStyle}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      className={`${baseClasses} ${className}`}
      style={combinedStyle}
    >
      {children}
    </View>
  );
}
