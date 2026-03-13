import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { CheckSquare, Square, ChevronDown, ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, Layout } from "react-native-reanimated";
import type { JobChecklistItem } from "@/types/models";

interface JobChecklistProps {
  items: JobChecklistItem[];
  onToggle: (itemId: string, completed: boolean) => void;
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

export function JobChecklist({ items, onToggle }: JobChecklistProps) {
  if (items.length === 0) {
    return (
      <Text className="text-sm text-slate-400 italic">No checklist items</Text>
    );
  }

  const completedCount = items.filter((i) => i.completed).length;
  const progress = items.length > 0 ? completedCount / items.length : 0;
  const groups = groupItems(items);
  const hasGroups = groups.some((g) => g.name !== null);

  const iconSize = 32;

  return (
    <View>
      {/* Overall progress bar */}
      <View className="flex-row items-center gap-2 mb-3">
        <View className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden h-3">
          <Animated.View
            className="h-full bg-emerald-500 rounded-full"
            style={{ width: `${progress * 100}%` }}
            layout={Layout.springify()}
          />
        </View>
        <Text className="text-sm font-medium text-slate-500">
          {completedCount}/{items.length}
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
}: {
  group: ChecklistGroup;
  onToggle: (itemId: string, completed: boolean) => void;
  iconSize: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const groupCompleted = group.items.filter((i) => i.completed).length;
  const ChevronIcon = collapsed ? ChevronRight : ChevronDown;

  return (
    <View className="mb-2">
      {/* Group header */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setCollapsed(!collapsed);
        }}
        className="flex-row items-center justify-between border-b border-slate-200 dark:border-slate-700 py-3"
        style={{ minHeight: 56 }}
        accessibilityLabel={`${group.name || "General"} group, ${groupCompleted} of ${group.items.length} completed`}
        accessibilityRole="button"
      >
        <View className="flex-row items-center gap-2">
          <ChevronIcon
            size={24}
            color="#64748b"
          />
          <Text
            className="text-base font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            {group.name || "General"}
          </Text>
        </View>
        <Text
          className="text-sm font-medium text-slate-500"
        >
          {groupCompleted}/{group.items.length}
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
          />
        ))}
    </View>
  );
}

function ChecklistItemRow({
  item,
  onToggle,
  iconSize,
}: {
  item: JobChecklistItem;
  onToggle: (itemId: string, completed: boolean) => void;
  iconSize: number;
}) {
  return (
    <Animated.View entering={FadeIn.duration(200)} layout={Layout.springify()}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle(item.id, !item.completed);
        }}
        className="flex-row items-center border-b border-slate-100 dark:border-slate-800 gap-4 py-4"
        style={{ minHeight: 56 }}
        accessibilityLabel={`${item.label}: ${item.completed ? "completed" : "not completed"}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.completed }}
      >
        {item.completed ? (
          <CheckSquare size={iconSize} color="#10b981" />
        ) : (
          <Square size={iconSize} color="#94a3b8" />
        )}
        <Text
          className={`flex-1 text-lg ${
            item.completed
              ? "text-slate-400 line-through"
              : "text-slate-900 dark:text-white"
          }`}
        >
          {item.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
