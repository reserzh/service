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
      <View className="w-20 h-20 rounded-full bg-stone-100 dark:bg-stone-800 items-center justify-center mb-4">
        {icon ?? <Inbox size={28} color="#A8A29E" />}
      </View>
      <Text className="text-xl font-heading font-bold text-stone-900 dark:text-white text-center mb-1">
        {title}
      </Text>
      {description && (
        <Text className="text-base text-stone-500 dark:text-stone-400 text-center mb-4">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} size="sm" variant="outline" />
      )}
    </View>
  );
}
