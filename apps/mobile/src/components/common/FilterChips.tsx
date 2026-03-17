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

// Signal design — orange active state, warm stone inactive, bold text
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
            accessibilityRole="button"
            accessibilityLabel={`${chip.label} filter${active ? ", selected" : ""}`}
            style={{ minHeight: 48 }}
            className={`px-5 py-3 rounded-xl ${
              active
                ? "bg-orange-600 dark:bg-orange-400"
                : "bg-white dark:bg-stone-800"
            }`}
          >
            <Text
              className={`text-base font-extrabold tracking-wide ${
                active
                  ? "text-white dark:text-stone-900"
                  : "text-stone-600 dark:text-stone-400"
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
