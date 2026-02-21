import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Clock, FileText, Users, Receipt } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  bgClass: string;
}

interface QuickActionsProps {
  onClockIn?: () => void;
}

export function QuickActions({ onClockIn }: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      icon: <Clock size={22} color="#3b82f6" />,
      label: "Clock In",
      onPress: onClockIn ?? (() => {}),
      bgClass: "bg-blue-50 dark:bg-blue-950",
    },
    {
      icon: <FileText size={22} color="#8b5cf6" />,
      label: "Estimate",
      onPress: () => router.push("/(tabs)/more/estimates/create"),
      bgClass: "bg-violet-50 dark:bg-violet-950",
    },
    {
      icon: <Users size={22} color="#f59e0b" />,
      label: "Customers",
      onPress: () => router.push("/(tabs)/more/customers"),
      bgClass: "bg-amber-50 dark:bg-amber-950",
    },
    {
      icon: <Receipt size={22} color="#10b981" />,
      label: "Invoices",
      onPress: () => router.push("/(tabs)/more/invoices"),
      bgClass: "bg-emerald-50 dark:bg-emerald-950",
    },
  ];

  return (
    <View className="flex-row gap-3">
      {actions.map((action) => (
        <Pressable
          key={action.label}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            action.onPress();
          }}
          className={`flex-1 items-center rounded-2xl py-3 ${action.bgClass} active:opacity-80`}
          accessibilityLabel={action.label}
          accessibilityRole="button"
        >
          <View className="mb-1.5">{action.icon}</View>
          <Text className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
