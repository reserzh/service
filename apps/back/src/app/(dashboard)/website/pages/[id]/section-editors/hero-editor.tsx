"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function HeroEditor({ content, onChange }: SectionEditorProps) {
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
          placeholder="Welcome to Our Business"
        />
      </div>
      <div className="space-y-2">
        <Label>Subheading</Label>
        <Input
          value={(content.subheading as string) || ""}
          onChange={(e) => update("subheading", e.target.value)}
          placeholder="Professional services you can trust"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>CTA Text</Label>
          <Input
            value={(content.ctaText as string) || ""}
            onChange={(e) => update("ctaText", e.target.value)}
            placeholder="Get a Quote"
          />
        </div>
        <div className="space-y-2">
          <Label>CTA Link</Label>
          <Input
            value={(content.ctaLink as string) || ""}
            onChange={(e) => update("ctaLink", e.target.value)}
            placeholder="/book"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Alignment</Label>
          <Select
            value={(content.alignment as string) || "center"}
            onValueChange={(v) => update("alignment", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Background Image URL</Label>
          <Input
            value={(content.backgroundImage as string) || ""}
            onChange={(e) => update("backgroundImage", e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>
    </div>
  );
}
