"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ListEditor } from "./list-editor";

type SectionEditorProps = {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
};

type FaqItem = {
  question: string;
  answer: string;
};

export function FaqEditor({ content, onChange }: SectionEditorProps) {
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
          placeholder="Frequently Asked Questions"
        />
      </div>
      <ListEditor<FaqItem>
        items={(content.items as FaqItem[]) || []}
        onChange={(items) => update("items", items)}
        label="Question"
        createItem={() => ({ question: "", answer: "" })}
        renderItem={(item, _index, updateField) => (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Question</Label>
              <Input
                value={item.question}
                onChange={(e) => updateField("question", e.target.value)}
                placeholder="What areas do you serve?"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Answer</Label>
              <Textarea
                value={item.answer}
                onChange={(e) => updateField("answer", e.target.value)}
                placeholder="We serve the greater metro area."
                rows={3}
              />
            </div>
          </div>
        )}
      />
    </div>
  );
}
