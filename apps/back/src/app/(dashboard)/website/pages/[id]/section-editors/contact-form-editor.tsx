"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Switch } from "@/components/ui/switch";

type SectionEditorProps = {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
};

export function ContactFormEditor({ content, onChange }: SectionEditorProps) {
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
          placeholder="Contact Us"
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <RichTextEditor
          value={(content.description as string) || ""}
          onChange={(html) => update("description", html)}
          placeholder="Get in touch with us..."
        />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={(content.showMap as boolean) ?? true}
            onCheckedChange={(v) => update("showMap", v)}
          />
          <Label>Show Map</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={(content.showPhone as boolean) ?? true}
            onCheckedChange={(v) => update("showPhone", v)}
          />
          <Label>Show Phone Number</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={(content.showEmail as boolean) ?? true}
            onCheckedChange={(v) => update("showEmail", v)}
          />
          <Label>Show Email Address</Label>
        </div>
      </div>
    </div>
  );
}
