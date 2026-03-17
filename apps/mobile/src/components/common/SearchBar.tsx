import { View, TextInput } from "react-native";
import { Search, X } from "lucide-react-native";
import { Pressable } from "react-native";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

// Signal design — warm stone search bar with orange focus hints
export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
}: SearchBarProps) {
  return (
    <View
      className="flex-row items-center bg-white dark:bg-stone-800 rounded-xl px-4 py-3.5 gap-2"
      style={{
        minHeight: 56,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <Search size={22} color="#A8A29E" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A8A29E"
        className="flex-1 text-lg font-semibold text-stone-900 dark:text-stone-50"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Search"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")} hitSlop={8}>
          <X size={18} color="#A8A29E" />
        </Pressable>
      )}
    </View>
  );
}
