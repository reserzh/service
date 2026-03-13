import { View, Text } from "react-native";
import { Image } from "expo-image";

interface AvatarProps {
  imageUrl?: string | null;
  initials: string;
  size?: "sm" | "md" | "lg";
  color?: string;
}

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
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
