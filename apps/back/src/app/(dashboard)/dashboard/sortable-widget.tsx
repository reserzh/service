"use client";

import { GripVertical, X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SortableWidgetProps {
  id: string;
  isEditing: boolean;
  size?: "full" | "half";
  onRemove?: () => void;
  onToggleSize?: () => void;
  isAIWidget?: boolean;
  onDragStart?: (id: string) => void;
  onDragOver?: (id: string) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  children: React.ReactNode;
}

export function SortableWidget({
  id,
  isEditing,
  size = "full",
  onRemove,
  onToggleSize,
  isAIWidget,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isDragOver,
  children,
}: SortableWidgetProps) {
  return (
    <div
      draggable={isEditing}
      onDragStart={(e) => {
        if (!isEditing) return;
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.(id);
      }}
      onDragOver={(e) => {
        if (!isEditing) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver?.(id);
      }}
      onDragEnd={() => {
        onDragEnd?.();
      }}
      className={`relative ${
        size === "half" ? "col-span-1" : "col-span-full"
      } ${isEditing ? "ring-2 ring-dashed ring-muted-foreground/20 rounded-xl" : ""} ${
        isDragging ? "opacity-50" : ""
      } ${isDragOver ? "ring-primary/50" : ""} transition-opacity`}
    >
      {isEditing && (
        <div className="absolute -top-3 right-2 z-10 flex items-center gap-1">
          {onToggleSize && (
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-md bg-background shadow-sm"
              onClick={onToggleSize}
              aria-label={size === "full" ? "Make half width" : "Make full width"}
            >
              {size === "full" ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Button>
          )}
          {isAIWidget && onRemove && (
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-md bg-background shadow-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={onRemove}
              aria-label="Remove widget"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <div
            className="flex h-6 w-6 cursor-grab items-center justify-center rounded-md border bg-background shadow-sm active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
