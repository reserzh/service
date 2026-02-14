import { View, TextInput } from "react-native";
import { Search, X } from "lucide-react-native";
import { Pressable } from "react-native";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
}: SearchBarProps) {
  return (
    <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2.5 gap-2">
      <Search size={18} color="#94a3b8" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        className="flex-1 text-base text-slate-900 dark:text-white"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")} hitSlop={8}>
          <X size={18} color="#94a3b8" />
        </Pressable>
      )}
    </View>
  );
}
