import { View, Text, TextInput, type TextInputProps } from "react-native";
import { forwardRef } from "react";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, containerClassName = "", ...props }, ref) => {
    return (
      <View className={`gap-1.5 ${containerClassName}`}>
        {label && (
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          className={`bg-white dark:bg-slate-900 border rounded-xl px-4 py-3 text-base text-slate-900 dark:text-white ${
            error
              ? "border-red-500"
              : "border-slate-300 dark:border-slate-600 focus:border-blue-500"
          }`}
          placeholderTextColor="#94a3b8"
          {...props}
        />
        {error && (
          <Text className="text-sm text-red-500">{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = "Input";
