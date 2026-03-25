import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Clock, FileText, Users, Receipt } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSignalColors } from "@/hooks/useSignalColors";

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

interface QuickActionsProps {
  onClockIn?: () => void;
}

// Signal design — warm orange-tinted quick actions with bold labels
export function QuickActions({ onClockIn }: QuickActionsProps) {
  const colors = useSignalColors();
  const accent = colors.accent;

  const actions: QuickAction[] = [
    {
      icon: <Clock size={28} color={accent} />,
      label: "Clock In",
      onPress: onClockIn ?? (() => {}),
    },
    {
      icon: <FileText size={28} color={accent} />,
      label: "Estimate",
      onPress: () => router.push("/(tabs)/more/estimates/create"),
    },
    {
      icon: <Users size={28} color={accent} />,
      label: "Customers",
      onPress: () => router.push("/(tabs)/more/customers"),
    },
    {
      icon: <Receipt size={28} color={accent} />,
      label: "Invoices",
      onPress: () => router.push("/(tabs)/more/invoices"),
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
          className="flex-1 items-center bg-white dark:bg-stone-800 rounded-xl py-3 active:scale-[0.97]"
          style={{
            minHeight: 72,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 2,
          }}
          accessibilityLabel={action.label}
          accessibilityRole="button"
        >
          <View className="mb-1.5">{action.icon}</View>
          <Text className="text-sm font-bold text-stone-700 dark:text-stone-300">
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
