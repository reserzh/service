import { View, Text } from "react-native";
import { Image } from "expo-image";

interface AvatarProps {
  imageUrl?: string | null;
  initials: string;
  size?: "sm" | "md" | "lg";
  color?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
};

export function Avatar({ imageUrl, initials, size = "md", color = "#3b82f6" }: AvatarProps) {
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        className={`${sizeClasses[size]} rounded-full`}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      className={`${sizeClasses[size]} rounded-full items-center justify-center`}
      style={{ backgroundColor: color + "20" }}
    >
      <Text
        className={`font-bold ${textSizeClasses[size]}`}
        style={{ color }}
      >
        {initials}
      </Text>
    </View>
  );
}
