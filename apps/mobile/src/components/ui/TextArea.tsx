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
          <Text className="text-base font-medium text-stone-700 dark:text-stone-300">
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className={`bg-stone-50 dark:bg-stone-800 border rounded-xl px-4 py-4 text-lg text-stone-900 dark:text-white min-h-[120px] ${
            error
              ? "border-red-500"
              : "border-stone-300 dark:border-stone-600 focus:border-orange-500"
          }`}
          placeholderTextColor="#A8A29E"
          {...props}
        />
        {error && <Text className="text-base text-red-500">{error}</Text>}
      </View>
    );
  }
);

TextArea.displayName = "TextArea";
;
