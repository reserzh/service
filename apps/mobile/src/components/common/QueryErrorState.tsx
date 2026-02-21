import { View, Text } from "react-native";
import { AlertCircle, RotateCcw } from "lucide-react-native";
import { Button } from "@/components/ui/Button";

interface QueryErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function QueryErrorState({ message, onRetry }: QueryErrorStateProps) {
  return (
    <View className="items-center py-12 px-8">
      <View className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 items-center justify-center mb-3">
        <AlertCircle size={24} color="#ef4444" />
      </View>
      <Text className="text-base font-semibold text-slate-900 dark:text-white mb-1 text-center">
        Failed to load
      </Text>
      <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
        {message || "Something went wrong. Please try again."}
      </Text>
      {onRetry && (
        <Button
          title="Retry"
          variant="outline"
          size="sm"
          onPress={onRetry}
          icon={<RotateCcw size={14} color="#2563eb" />}
        />
      )}
    </View>
  );
}
