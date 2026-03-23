import { View, Text } from "react-native";
import { Check } from "lucide-react-native";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <View className="flex-row items-center justify-center px-4 py-3">
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <View key={label} className="flex-row items-center">
            {/* Circle */}
            <View className="items-center">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  isCompleted
                    ? "bg-orange-600"
                    : isCurrent
                    ? "bg-orange-600"
                    : "bg-stone-200 dark:bg-stone-700"
                }`}
              >
                {isCompleted ? (
                  <Check size={16} color="#ffffff" />
                ) : (
                  <Text
                    className={`text-sm font-bold ${
                      isCurrent ? "text-white" : "text-stone-500 dark:text-stone-400"
                    }`}
                  >
                    {stepNum}
                  </Text>
                )}
              </View>
              <Text
                className={`text-[10px] mt-1 ${
                  isCurrent
                    ? "text-orange-600 dark:text-orange-400 font-semibold"
                    : "text-stone-400 dark:text-stone-500"
                }`}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <View
                className={`h-0.5 w-6 mx-1 mb-4 ${
                  isCompleted ? "bg-orange-600" : "bg-stone-200 dark:bg-stone-700"
                }`}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}
