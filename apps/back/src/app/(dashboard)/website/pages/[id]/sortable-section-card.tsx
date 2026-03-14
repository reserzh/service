"use client";

import { memo, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GripVertical,
  Eye,
  EyeOff,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
} from "lucide-react";
import { getSectionEditor, SectionSettingsEditor } from "./section-editors";

type Section = {
  id: string;
  type: string;
  content: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  sortOrder: number;
  isVisible: boolean;
};

type SortableSectionCardProps = {
  section: Section;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onContentChange: (content: Record<string, unknown>) => void;
  onSettingsChange: (settings: Record<string, unknown>) => void;
  onSave: () => void;
  isDirty: boolean;
};

export const SortableSectionCard = memo(function SortableSectionCard({
  section,
  onToggleVisibility,
  onDelete,
  onContentChange,
  onSettingsChange,
  onSave,
  isDirty,
}: SortableSectionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Editor = getSectionEditor(section.type);
  const typeLabel = section.type.replace(/_/g, " ");

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`${!section.isVisible ? "opacity-50" : ""} ${isDragging ? "z-50 shadow-lg" : ""}`}
    >
      <CardContent className="flex items-center gap-3 py-3">
        <button
          aria-label={`Reorder ${typeLabel} section`}
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          className="flex-1 flex items-center gap-2 text-left"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${typeLabel} editor`}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <Badge variant="outline" className="capitalize">
            {typeLabel}
          </Badge>
          {!section.isVisible && <Badge variant="secondary">Hidden</Badge>}
          {isDirty && (
            <Badge variant="default" className="text-xs">
              Unsaved
            </Badge>
          )}
        </button>
        <div className="flex items-center gap-1">
          {isDirty && (
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={onSave} aria-label="Save section">
              <Save className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleVisibility}
            aria-label={section.isVisible ? "Hide section" : "Show section"}
          >
            {section.isVisible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={onDelete}
            aria-label="Delete section"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3">
          {Editor ? (
            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="content" className="mt-4">
                <Editor
                  content={section.content ?? {}}
                  onChange={onContentChange}
                />
              </TabsContent>
              <TabsContent value="settings" className="mt-4">
                <SectionSettingsEditor
                  settings={section.settings ?? {}}
                  onChange={onSettingsChange}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No visual editor available for this section type.
            </p>
          )}
        </div>
      )}
    </Card>
  );
});
