import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertTriangle, RotateCcw } from "lucide-react-native";
import { Button } from "@/components/ui/Button";

interface ErrorFallbackProps {
  error?: Error | null;
  onRetry?: () => void;
  message?: string;
}

export function ErrorFallback({ error, onRetry, message }: ErrorFallbackProps) {
  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 items-center justify-center mb-4">
          <AlertTriangle size={32} color="#ef4444" />
        </View>
        <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
          Something went wrong
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
          {message || error?.message || "An unexpected error occurred. Please try again."}
        </Text>
        {onRetry && (
          <Button
            title="Try Again"
            onPress={onRetry}
            icon={<RotateCcw size={16} color="#fff" />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
