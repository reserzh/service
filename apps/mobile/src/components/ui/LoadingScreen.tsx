import { View, ActivityIndicator, Text } from "react-native";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
      <ActivityIndicator size="large" color="#3b82f6" />
      {message && (
        <Text className="text-sm text-slate-500 dark:text-slate-400 mt-3">
          {message}
        </Text>
      )}
    </View>
  );
}
