"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical, Loader2 } from "lucide-react";

interface TemplateData {
  id?: string;
  name: string;
  description: string | null;
  jobType: string | null;
  isActive: boolean;
  items: { id: string; label: string }[];
}

interface Props {
  template?: TemplateData;
  saveAction: (data: {
    name: string;
    description?: string;
    jobType?: string;
    isActive?: boolean;
    items: string[];
  }) => Promise<{ error?: string }>;
}

export function ChecklistTemplateForm({ template, saveAction }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [jobType, setJobType] = useState(template?.jobType ?? "");
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [items, setItems] = useState<string[]>(
    template?.items.map((i) => i.label) ?? [""]
  );

  function addItem() {
    setItems([...items, ""]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, value: string) {
    const updated = [...items];
    updated[index] = value;
    setItems(updated);
  }

  function handleSubmit() {
    if (!name.trim()) {
      showToast.error("Validation", "Template name is required");
      return;
    }

    const validItems = items.filter((i) => i.trim());
    if (validItems.length === 0) {
      showToast.error("Validation", "At least one checklist item is required");
      return;
    }

    startTransition(async () => {
      const result = await saveAction({
        name: name.trim(),
        description: description.trim() || undefined,
        jobType: jobType.trim() || undefined,
        isActive,
        items: validItems,
      });

      if (result.error) {
        showToast.error("Error", result.error);
      } else {
        showToast.saved("Checklist template");
        router.push("/settings/checklists");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Lawn Mowing Checklist"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobType">Job Type (optional filter)</Label>
            <Input
              id="jobType"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              placeholder="e.g., Lawn Mowing"
            />
          </div>
          {template && (
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Active</Label>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Checklist Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={item}
                onChange={(e) => updateItem(idx, e.target.value)}
                placeholder={`Item ${idx + 1}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem();
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => removeItem(idx)}
                disabled={items.length <= 1}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addItem} className="mt-2">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Item
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {template ? "Save Changes" : "Create Template"}
        </Button>
      </div>
    </div>
  );
}
