"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SectionEditorProps = {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
};

export function AboutEditor({ content, onChange }: SectionEditorProps) {
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
          placeholder="About Us"
        />
      </div>
      <div className="space-y-2">
        <Label>Content</Label>
        <Textarea
          value={(content.content as string) || ""}
          onChange={(e) => update("content", e.target.value)}
          placeholder="Tell your story here..."
          rows={6}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Image URL</Label>
          <Input
            value={(content.image as string) || ""}
            onChange={(e) => update("image", e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label>Layout</Label>
          <Select
            value={(content.layout as string) || "left"}
            onValueChange={(v) => update("layout", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Image Left</SelectItem>
              <SelectItem value="right">Image Right</SelectItem>
              <SelectItem value="center">Centered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
