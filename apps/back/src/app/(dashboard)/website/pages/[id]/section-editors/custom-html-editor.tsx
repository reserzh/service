"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SectionEditorProps = {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
};

export function CustomHtmlEditor({ content, onChange }: SectionEditorProps) {
  return (
    <div className="space-y-2">
      <Label>HTML Content</Label>
      <Textarea
        value={(content.html as string) || ""}
        onChange={(e) => onChange({ ...content, html: e.target.value })}
        className="font-mono text-sm"
        rows={12}
        placeholder="<div>Your custom HTML here...</div>"
      />
    </div>
  );
}
