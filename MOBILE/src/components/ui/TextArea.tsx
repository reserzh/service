import { View, Text, TextInput, type TextInputProps } from "react-native";
import { forwardRef } from "react";

interface TextAreaProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<TextInput, TextAreaProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <View className="gap-1.5">
        {label && (
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className={`bg-white dark:bg-slate-900 border rounded-xl px-4 py-3 text-base text-slate-900 dark:text-white min-h-[100px] ${
            error
              ? "border-red-500"
              : "border-slate-300 dark:border-slate-600 focus:border-blue-500"
          }`}
          placeholderTextColor="#94a3b8"
          {...props}
        />
        {error && <Text className="text-sm text-red-500">{error}</Text>}
      </View>
    );
  }
);

TextArea.displayName = "TextArea";
