import { View, ActivityIndicator, Text } from "react-native";
import { useSignalColors } from "@/hooks/useSignalColors";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const colors = useSignalColors();
  return (
    <View className="flex-1 items-center justify-center bg-stone-50 dark:bg-stone-900">
      <ActivityIndicator size="large" color={colors.accent} />
      {message && (
        <Text className="text-sm text-stone-500 dark:text-stone-400 mt-3">
          {message}
        </Text>
      )}
    </View>
  );
}
