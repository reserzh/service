"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ListEditor } from "./list-editor";

type SectionEditorProps = {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
};

type FeatureItem = {
  icon: string;
  title: string;
  description: string;
};

export function FeaturesEditor({ content, onChange }: SectionEditorProps) {
  const update = (key: string, value: unknown) => {
    onChange({ ...content, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Heading</Label>
        <Input
          value={(content.heading as string) || ""}
          onChange={(e) => update("heading", e.target.value)}
          placeholder="Why Choose Us"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Description</Label>
          <RichTextEditor
            value={(content.description as string) || ""}
            onChange={(html) => update("description", html)}
            placeholder="Optional description..."
          />
        </div>
        <div className="space-y-2">
          <Label>Columns</Label>
          <Input
            type="number"
            min={1}
            max={4}
            value={(content.columns as number) || 3}
            onChange={(e) => update("columns", Number(e.target.value))}
          />
        </div>
      </div>
      <ListEditor<FeatureItem>
        items={(content.items as FeatureItem[]) || []}
        onChange={(items) => update("items", items)}
        label="Feature"
        createItem={() => ({ icon: "", title: "", description: "" })}
        renderItem={(item, _index, updateField) => (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Icon Name</Label>
                <Input
                  value={item.icon}
                  onChange={(e) => updateField("icon", e.target.value)}
                  placeholder="shield-check"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Title</Label>
                <Input
                  value={item.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Licensed & Insured"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Input
                value={item.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Fully certified professionals"
              />
            </div>
          </div>
        )}
      />
    </div>
  );
}
