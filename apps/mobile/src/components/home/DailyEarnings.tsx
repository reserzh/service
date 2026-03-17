import { View, Text } from "react-native";
import { DollarSign } from "lucide-react-native";
import { formatCurrency } from "@/lib/format";
import Animated, { FadeInDown } from "react-native-reanimated";

interface DailyEarningsProps {
  earnings: number;
}

export function DailyEarnings({ earnings }: DailyEarningsProps) {
  return (
    <Animated.View
      className="flex-1"
      entering={FadeInDown.delay(240).duration(400).springify()}
    >
      <View className="rounded-xl p-3 bg-green-50 dark:bg-green-950">
        <View className="mb-2">
          <DollarSign size={20} color="#22c55e" />
        </View>
        <Text className="text-2xl font-bold text-stone-900 dark:text-white">
          {formatCurrency(earnings)}
        </Text>
        <Text className="text-xs text-stone-500 dark:text-stone-400">
          Earnings
        </Text>
      </View>
    </Animated.View>
  );
}
