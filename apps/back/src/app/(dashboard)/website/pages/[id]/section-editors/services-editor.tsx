"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

export function ServicesEditor({ content, onChange }: SectionEditorProps) {
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
          placeholder="Our Services"
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={(content.description as string) || ""}
          onChange={(e) => update("description", e.target.value)}
          placeholder="What we offer"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Layout</Label>
          <Select
            value={(content.layout as string) || "grid"}
            onValueChange={(v) => update("layout", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Grid</SelectItem>
              <SelectItem value="list">List</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch
            checked={(content.showPricing as boolean) ?? true}
            onCheckedChange={(v) => update("showPricing", v)}
          />
          <Label>Show Pricing</Label>
        </div>
      </div>
    </div>
  );
}
