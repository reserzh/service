"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type SectionEditorProps = {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
};

export function BookingWidgetEditor({ content, onChange }: SectionEditorProps) {
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
          placeholder="Book a Service"
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={(content.description as string) || ""}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Schedule your appointment online"
        />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={(content.showServicePicker as boolean) ?? true}
            onCheckedChange={(v) => update("showServicePicker", v)}
          />
          <Label>Show Service Picker</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={(content.showDatePicker as boolean) ?? true}
            onCheckedChange={(v) => update("showDatePicker", v)}
          />
          <Label>Show Date Picker</Label>
        </div>
      </div>
    </div>
  );
}
