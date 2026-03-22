import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { CheckSquare, Square, PackageCheck, Package, ChevronDown, ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, Layout } from "react-native-reanimated";
import type { JobChecklistItem } from "@/types/models";

interface JobChecklistProps {
  items: JobChecklistItem[];
  onToggle: (itemId: string, completed: boolean) => void;
  type?: "checklist" | "equipment";
}

interface ChecklistGroup {
  name: string | null;
  sortOrder: number;
  items: JobChecklistItem[];
}

function groupItems(items: JobChecklistItem[]): ChecklistGroup[] {
  const groupMap = new Map<string | null, JobChecklistItem[]>();
  const groupOrderMap = new Map<string | null, number>();

  for (const item of items) {
    const key = item.groupName ?? null;
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
      groupOrderMap.set(key, item.groupSortOrder ?? 0);
    }
    groupMap.get(key)!.push(item);
  }

  const groups: ChecklistGroup[] = [];
  for (const [name, groupItems] of groupMap.entries()) {
    groups.push({
      name,
      sortOrder: groupOrderMap.get(name) ?? 0,
      items: groupItems,
    });
  }
  groups.sort((a, b) => a.sortOrder - b.sortOrder);
  return groups;
}

export function JobChecklist({ items, onToggle, type = "checklist" }: JobChecklistProps) {
  const isEquipment = type === "equipment";

  if (items.length === 0) {
    return (
      <Text className="text-sm text-stone-400 italic">
        {isEquipment ? "No equipment items" : "No checklist items"}
      </Text>
    );
  }

  const completedCount = items.filter((i) => i.completed).length;
  const progress = items.length > 0 ? completedCount / items.length : 0;
  const groups = groupItems(items);
  const hasGroups = groups.some((g) => g.name !== null);

  const iconSize = 32;
  const progressLabel = isEquipment
    ? `${completedCount}/${items.length} packed`
    : `${completedCount}/${items.length}`;

  return (
    <View>
      {/* Overall progress bar */}
      <View className="flex-row items-center gap-2 mb-3">
        <View className="flex-1 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden h-3">
          <Animated.View
            className={`h-full rounded-full ${isEquipment ? "bg-orange-500" : "bg-emerald-500"}`}
            style={{ width: `${progress * 100}%` }}
            layout={Layout.springify()}
          />
        </View>
        <Text className="text-sm font-medium text-stone-500">
          {progressLabel}
        </Text>
      </View>

      {/* Grouped items */}
      {hasGroups ? (
        groups.map((group) => (
          <GroupSection
            key={group.name ?? "__ungrouped"}
            group={group}
            onToggle={onToggle}
            iconSize={iconSize}
            isEquipment={isEquipment}
          />
        ))
      ) : (
        // Flat list (no groups)
        items.map((item) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            onToggle={onToggle}
            iconSize={iconSize}
            isEquipment={isEquipment}
          />
        ))
      )}
    </View>
  );
}

function GroupSection({
  group,
  onToggle,
  iconSize,
  isEquipment,
}: {
  group: ChecklistGroup;
  onToggle: (itemId: string, completed: boolean) => void;
  iconSize: number;
  isEquipment: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const groupCompleted = group.items.filter((i) => i.completed).length;
  const ChevronIcon = collapsed ? ChevronRight : ChevronDown;
  const countLabel = isEquipment
    ? `${groupCompleted}/${group.items.length} packed`
    : `${groupCompleted}/${group.items.length}`;
  const a11yVerb = isEquipment ? "packed" : "completed";

  return (
    <View className="mb-2">
      {/* Group header */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setCollapsed(!collapsed);
        }}
        className="flex-row items-center justify-between border-b border-stone-200 dark:border-stone-700 py-3"
        style={{ minHeight: 56 }}
        accessibilityLabel={`${group.name || "General"} group, ${groupCompleted} of ${group.items.length} ${a11yVerb}`}
        accessibilityRole="button"
      >
        <View className="flex-row items-center gap-2">
          <ChevronIcon
            size={24}
            color="#78716C"
          />
          <Text
            className="text-base font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400"
          >
            {group.name || "General"}
          </Text>
        </View>
        <Text
          className="text-sm font-medium text-stone-500"
        >
          {countLabel}
        </Text>
      </Pressable>

      {/* Group items */}
      {!collapsed &&
        group.items.map((item) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            onToggle={onToggle}
            iconSize={iconSize}
            isEquipment={isEquipment}
          />
        ))}
    </View>
  );
}

function ChecklistItemRow({
  item,
  onToggle,
  iconSize,
  isEquipment,
}: {
  item: JobChecklistItem;
  onToggle: (itemId: string, completed: boolean) => void;
  iconSize: number;
  isEquipment: boolean;
}) {
  const CheckedIcon = isEquipment ? PackageCheck : CheckSquare;
  const UncheckedIcon = isEquipment ? Package : Square;
  const checkedColor = isEquipment ? "#EA580C" : "#10b981";
  const a11yChecked = isEquipment ? "packed" : "completed";
  const a11yUnchecked = isEquipment ? "not packed" : "not completed";

  return (
    <Animated.View entering={FadeIn.duration(200)} layout={Layout.springify()}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle(item.id, !item.completed);
        }}
        className="flex-row items-center border-b border-stone-100 dark:border-stone-700 gap-4 py-4"
        style={{ minHeight: 56 }}
        accessibilityLabel={`${item.label}: ${item.completed ? a11yChecked : a11yUnchecked}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.completed }}
      >
        {item.completed ? (
          <CheckedIcon size={iconSize} color={checkedColor} />
        ) : (
          <UncheckedIcon size={iconSize} color="#A8A29E" />
        )}
        <Text
          className={`flex-1 text-lg ${
            item.completed
              ? "text-stone-400 line-through"
              : "text-stone-900 dark:text-white"
          }`}
        >
          {item.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
