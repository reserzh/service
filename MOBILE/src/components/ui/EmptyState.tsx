import { View, Text } from "react-native";
import { Inbox } from "lucide-react-native";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4">
        {icon ?? <Inbox size={28} color="#94a3b8" />}
      </View>
      <Text className="text-lg font-semibold text-slate-900 dark:text-white text-center mb-1">
        {title}
      </Text>
      {description && (
        <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} size="sm" variant="outline" />
      )}
    </View>
  );
}
