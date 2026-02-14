import { ScrollView, Pressable, Text } from "react-native";
import * as Haptics from "expo-haptics";

interface FilterChip {
  key: string;
  label: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export function FilterChips({ chips, activeKey, onSelect }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-1"
    >
      {chips.map((chip) => {
        const active = chip.key === activeKey;
        return (
          <Pressable
            key={chip.key}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(chip.key);
            }}
            className={`px-4 py-2 rounded-full border ${
              active
                ? "bg-blue-600 border-blue-600"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                active
                  ? "text-white"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
