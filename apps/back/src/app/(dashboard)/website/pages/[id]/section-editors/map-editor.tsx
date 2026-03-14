"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type SectionEditorProps = {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
};

export function MapEditor({ content, onChange }: SectionEditorProps) {
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
          placeholder="Find Us"
        />
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Input
          value={(content.address as string) || ""}
          onChange={(e) => update("address", e.target.value)}
          placeholder="123 Main St, City, State 12345"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={(content.showDirectionsLink as boolean) ?? true}
          onCheckedChange={(v) => update("showDirectionsLink", v)}
        />
        <Label>Show Directions Link</Label>
      </div>
    </div>
  );
}
