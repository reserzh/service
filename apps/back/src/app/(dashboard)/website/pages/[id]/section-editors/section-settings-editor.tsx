"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SectionSettingsEditorProps = {
  settings: Record<string, unknown>;
  onChange: (settings: Record<string, unknown>) => void;
};

export function SectionSettingsEditor({ settings, onChange }: SectionSettingsEditorProps) {
  const update = (key: string, value: unknown) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Background Color</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={(settings.backgroundColor as string) || "#ffffff"}
            onChange={(e) => update("backgroundColor", e.target.value)}
            className="h-8 w-8 rounded border cursor-pointer"
            aria-label="Background color picker"
          />
          <Input
            value={(settings.backgroundColor as string) || ""}
            onChange={(e) => update("backgroundColor", e.target.value)}
            placeholder="#ffffff"
            className="flex-1"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Text Color</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={(settings.textColor as string) || "#000000"}
            onChange={(e) => update("textColor", e.target.value)}
            className="h-8 w-8 rounded border cursor-pointer"
            aria-label="Text color picker"
          />
          <Input
            value={(settings.textColor as string) || ""}
            onChange={(e) => update("textColor", e.target.value)}
            placeholder="#000000"
            className="flex-1"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Vertical Padding</Label>
        <Select
          value={(settings.paddingY as string) || "md"}
          onValueChange={(v) => update("paddingY", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
            <SelectItem value="xl">Extra Large</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Horizontal Padding</Label>
        <Select
          value={(settings.paddingX as string) || "md"}
          onValueChange={(v) => update("paddingX", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
            <SelectItem value="xl">Extra Large</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Max Width</Label>
        <Select
          value={(settings.maxWidth as string) || "lg"}
          onValueChange={(v) => update("maxWidth", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small (640px)</SelectItem>
            <SelectItem value="md">Medium (768px)</SelectItem>
            <SelectItem value="lg">Large (1024px)</SelectItem>
            <SelectItem value="xl">XL (1280px)</SelectItem>
            <SelectItem value="full">Full Width</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2 pt-6">
        <Switch
          checked={(settings.fullWidth as boolean) || false}
          onCheckedChange={(v) => update("fullWidth", v)}
        />
        <Label>Full Width</Label>
      </div>
    </div>
  );
}
