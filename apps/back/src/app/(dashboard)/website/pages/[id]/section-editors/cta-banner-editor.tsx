"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SectionEditorProps = {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
};

export function CtaBannerEditor({ content, onChange }: SectionEditorProps) {
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
          placeholder="Ready to Get Started?"
        />
      </div>
      <div className="space-y-2">
        <Label>Subheading</Label>
        <Input
          value={(content.subheading as string) || ""}
          onChange={(e) => update("subheading", e.target.value)}
          placeholder="Contact us today for a free estimate"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>CTA Text</Label>
          <Input
            value={(content.ctaText as string) || ""}
            onChange={(e) => update("ctaText", e.target.value)}
            placeholder="Call Now"
          />
        </div>
        <div className="space-y-2">
          <Label>CTA Link</Label>
          <Input
            value={(content.ctaLink as string) || ""}
            onChange={(e) => update("ctaLink", e.target.value)}
            placeholder="tel:..."
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Background Color</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={(content.backgroundColor as string) || "#1e40af"}
            onChange={(e) => update("backgroundColor", e.target.value)}
            className="h-8 w-8 rounded border cursor-pointer"
            aria-label="Background color picker"
          />
          <Input
            value={(content.backgroundColor as string) || ""}
            onChange={(e) => update("backgroundColor", e.target.value)}
            placeholder="#1e40af"
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
