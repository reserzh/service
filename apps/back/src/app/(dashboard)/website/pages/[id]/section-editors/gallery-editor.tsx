"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListEditor } from "./list-editor";

type SectionEditorProps = {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
};

type GalleryImage = {
  url: string;
  alt: string;
  caption: string;
};

export function GalleryEditor({ content, onChange }: SectionEditorProps) {
  const update = (key: string, value: unknown) => {
    onChange({ ...content, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Heading</Label>
          <Input
            value={(content.heading as string) || ""}
            onChange={(e) => update("heading", e.target.value)}
            placeholder="Our Work"
          />
        </div>
        <div className="space-y-2">
          <Label>Columns</Label>
          <Input
            type="number"
            min={1}
            max={6}
            value={(content.columns as number) || 3}
            onChange={(e) => update("columns", Number(e.target.value))}
          />
        </div>
      </div>
      <ListEditor<GalleryImage>
        items={(content.images as GalleryImage[]) || []}
        onChange={(images) => update("images", images)}
        label="Image"
        createItem={() => ({ url: "", alt: "", caption: "" })}
        renderItem={(item, _index, updateField) => (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Image URL</Label>
              <Input
                value={item.url}
                onChange={(e) => updateField("url", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Alt Text</Label>
                <Input
                  value={item.alt}
                  onChange={(e) => updateField("alt", e.target.value)}
                  placeholder="Image description"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Caption</Label>
                <Input
                  value={item.caption}
                  onChange={(e) => updateField("caption", e.target.value)}
                  placeholder="Optional caption"
                />
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}
