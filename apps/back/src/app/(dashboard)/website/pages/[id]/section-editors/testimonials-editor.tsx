"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListEditor } from "./list-editor";

type SectionEditorProps = {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
};

type TestimonialItem = {
  name: string;
  text: string;
  rating: number;
  photo: string;
};

export function TestimonialsEditor({ content, onChange }: SectionEditorProps) {
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
          placeholder="What Our Customers Say"
        />
      </div>
      <ListEditor<TestimonialItem>
        items={(content.items as TestimonialItem[]) || []}
        onChange={(items) => update("items", items)}
        label="Testimonial"
        createItem={() => ({ name: "", text: "", rating: 5, photo: "" })}
        renderItem={(item, _index, updateField) => (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input
                  value={item.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="John D."
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Rating</Label>
                <Select
                  value={String(item.rating || 5)}
                  onValueChange={(v) => updateField("rating", Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((r) => (
                      <SelectItem key={r} value={String(r)}>
                        {"★".repeat(r)}{"☆".repeat(5 - r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Review Text</Label>
              <RichTextEditor
                value={item.text}
                onChange={(html) => updateField("text", html)}
                placeholder="Great service!"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Photo URL</Label>
              <Input
                value={item.photo}
                onChange={(e) => updateField("photo", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        )}
      />
    </div>
  );
}
