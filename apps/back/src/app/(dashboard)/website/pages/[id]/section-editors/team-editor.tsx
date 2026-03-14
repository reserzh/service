"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ListEditor } from "./list-editor";

type SectionEditorProps = {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
};

type TeamMember = {
  name: string;
  role: string;
  bio: string;
  photo: string;
};

export function TeamEditor({ content, onChange }: SectionEditorProps) {
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
          placeholder="Our Team"
        />
      </div>
      <ListEditor<TeamMember>
        items={(content.members as TeamMember[]) || []}
        onChange={(members) => update("members", members)}
        label="Member"
        createItem={() => ({ name: "", role: "", bio: "", photo: "" })}
        renderItem={(item, _index, updateField) => (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input
                  value={item.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Role</Label>
                <Input
                  value={item.role}
                  onChange={(e) => updateField("role", e.target.value)}
                  placeholder="Lead Technician"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bio</Label>
              <Textarea
                value={item.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                placeholder="Brief bio..."
                rows={2}
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
