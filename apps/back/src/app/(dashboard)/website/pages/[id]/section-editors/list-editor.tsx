"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

type ListEditorProps<T extends Record<string, unknown>> = {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, index: number, update: (field: string, value: unknown) => void) => React.ReactNode;
  createItem: () => T;
  label?: string;
};

export function ListEditor<T extends Record<string, unknown>>({
  items,
  onChange,
  renderItem,
  createItem,
  label = "Item",
}: ListEditorProps<T>) {
  const keyCounterRef = useRef(0);
  const keysRef = useRef<string[]>([]);

  // Ensure we have a stable key for each item position
  while (keysRef.current.length < items.length) {
    keysRef.current.push(`item-${++keyCounterRef.current}`);
  }
  // Trim excess keys when items are removed
  if (keysRef.current.length > items.length) {
    keysRef.current = keysRef.current.slice(0, items.length);
  }

  const addItem = () => {
    keysRef.current.push(`item-${++keyCounterRef.current}`);
    onChange([...items, createItem()]);
  };

  const removeItem = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    const nextKeys = [...keysRef.current];
    nextKeys.splice(index, 1);
    keysRef.current = nextKeys;
    onChange(next);
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const next = [...items];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= next.length) return;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    const nextKeys = [...keysRef.current];
    [nextKeys[index], nextKeys[swapIndex]] = [nextKeys[swapIndex], nextKeys[index]];
    keysRef.current = nextKeys;
    onChange(next);
  };

  const updateItem = (index: number, field: string, value: unknown) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value } as T;
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={keysRef.current[index]} className="rounded-lg border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {label} {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => moveItem(index, "up")}
                disabled={index === 0}
                aria-label={`Move ${label} ${index + 1} up`}
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => moveItem(index, "down")}
                disabled={index === items.length - 1}
                aria-label={`Move ${label} ${index + 1} down`}
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => removeItem(index)}
                aria-label={`Remove ${label} ${index + 1}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {renderItem(item, index, (field, value) => updateItem(index, field, value))}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="mr-2 h-3 w-3" />
        Add {label}
      </Button>
    </div>
  );
}
