"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ListEditor } from "./list-editor";

type SectionEditorProps = {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
};

type PricingTier = {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted: boolean;
};

export function PricingEditor({ content, onChange }: SectionEditorProps) {
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
          placeholder="Our Pricing"
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={(content.description as string) || ""}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Choose the right plan for you"
        />
      </div>
      <ListEditor<PricingTier>
        items={(content.items as PricingTier[]) || []}
        onChange={(items) => update("items", items)}
        label="Tier"
        createItem={() => ({
          name: "",
          price: "",
          description: "",
          features: [],
          highlighted: false,
        })}
        renderItem={(item, _index, updateField) => (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Plan Name</Label>
                <Input
                  value={item.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Basic"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price</Label>
                <Input
                  value={item.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  placeholder="$99/mo"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Input
                value={item.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Perfect for small businesses"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Features (one per line)</Label>
              <Textarea
                value={(item.features || []).join("\n")}
                onChange={(e) =>
                  updateField(
                    "features",
                    e.target.value.split("\n").filter(Boolean)
                  )
                }
                placeholder={"Feature 1\nFeature 2\nFeature 3"}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={item.highlighted || false}
                onCheckedChange={(v) => updateField("highlighted", v)}
              />
              <Label className="text-xs">Highlighted / Featured</Label>
            </div>
          </div>
        )}
      />
    </div>
  );
}
