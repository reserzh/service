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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface OptionItem {
  description: string;
  quantity: string;
  unitPrice: string;
  type: string;
}

interface Option {
  name: string;
  description: string;
  isRecommended: boolean;
  items: OptionItem[];
}

interface TemplateData {
  id?: string;
  name: string;
  description: string | null;
  summary: string | null;
  notes: string | null;
  isActive: boolean;
  options: {
    name: string;
    description: string | null;
    isRecommended: boolean;
    items: { description: string; quantity: string; unitPrice: string; type: string }[];
  }[];
}

interface Props {
  template?: TemplateData;
  saveAction: (data: {
    name: string;
    description?: string;
    summary?: string;
    notes?: string;
    isActive?: boolean;
    options: {
      name: string;
      description?: string;
      isRecommended?: boolean;
      items: { description: string; quantity: number; unitPrice: number; type?: string }[];
    }[];
  }) => Promise<{ error?: string }>;
}

const emptyItem: OptionItem = { description: "", quantity: "1", unitPrice: "", type: "service" };
const emptyOption: Option = { name: "Option 1", description: "", isRecommended: false, items: [{ ...emptyItem }] };

export function EstimateTemplateForm({ template, saveAction }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [summary, setSummary] = useState(template?.summary ?? "");
  const [notes, setNotes] = useState(template?.notes ?? "");
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [options, setOptions] = useState<Option[]>(
    template?.options.map((o) => ({
      name: o.name,
      description: o.description || "",
      isRecommended: o.isRecommended,
      items: o.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        type: i.type,
      })),
    })) ?? [{ ...emptyOption }]
  );

  function updateOption(index: number, field: keyof Option, value: unknown) {
    const updated = [...options];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[index] as any)[field] = value;
    setOptions(updated);
  }

  function addOption() {
    setOptions([...options, { ...emptyOption, name: `Option ${options.length + 1}`, items: [{ ...emptyItem }] }]);
  }

  function removeOption(index: number) {
    setOptions(options.filter((_, i) => i !== index));
  }

  function updateItem(optIdx: number, itemIdx: number, field: keyof OptionItem, value: string) {
    const updated = [...options];
    updated[optIdx] = { ...updated[optIdx], items: [...updated[optIdx].items] };
    updated[optIdx].items[itemIdx] = { ...updated[optIdx].items[itemIdx], [field]: value };
    setOptions(updated);
  }

  function addItem(optIdx: number) {
    const updated = [...options];
    updated[optIdx] = { ...updated[optIdx], items: [...updated[optIdx].items, { ...emptyItem }] };
    setOptions(updated);
  }

  function removeItem(optIdx: number, itemIdx: number) {
    const updated = [...options];
    updated[optIdx] = { ...updated[optIdx], items: updated[optIdx].items.filter((_, i) => i !== itemIdx) };
    setOptions(updated);
  }

  function handleSubmit() {
    if (!name.trim()) {
      showToast.error("Validation", "Template name is required");
      return;
    }

    startTransition(async () => {
      const result = await saveAction({
        name: name.trim(),
        description: description.trim() || undefined,
        summary: summary.trim() || undefined,
        notes: notes.trim() || undefined,
        isActive,
        options: options.map((opt) => ({
          name: opt.name,
          description: opt.description || undefined,
          isRecommended: opt.isRecommended,
          items: opt.items
            .filter((i) => i.description.trim())
            .map((i) => ({
              description: i.description,
              quantity: Number(i.quantity) || 1,
              unitPrice: Number(i.unitPrice) || 0,
              type: i.type || undefined,
            })),
        })),
      });

      if (result.error) {
        showToast.error("Error", result.error);
      } else {
        showToast.saved("Estimate template");
        router.push("/settings/estimate-templates");
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Standard Lawn Service" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Estimate Summary</Label>
              <Input id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Summary for generated estimates" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Internal description" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Estimate Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes included on generated estimates" rows={2} />
          </div>
          {template && (
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Active</Label>
            </div>
          )}
        </CardContent>
      </Card>

      {options.map((opt, oi) => (
        <Card key={oi}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">{opt.name || `Option ${oi + 1}`}</CardTitle>
            {options.length > 1 && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeOption(oi)}>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Option Name</Label>
                <Input value={opt.name} onChange={(e) => updateOption(oi, "name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Option Description</Label>
                <Input value={opt.description} onChange={(e) => updateOption(oi, "description", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Line Items</Label>
              {opt.items.map((item, ii) => (
                <div key={ii} className="flex items-center gap-2">
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(oi, ii, "description", e.target.value)}
                    placeholder="Description"
                    className="flex-1"
                  />
                  <Input
                    value={item.quantity}
                    onChange={(e) => updateItem(oi, ii, "quantity", e.target.value)}
                    placeholder="Qty"
                    className="w-16"
                    type="number"
                  />
                  <Input
                    value={item.unitPrice}
                    onChange={(e) => updateItem(oi, ii, "unitPrice", e.target.value)}
                    placeholder="Price"
                    className="w-24"
                    type="number"
                    step="0.01"
                  />
                  <Select value={item.type} onValueChange={(v) => updateItem(oi, ii, "type", v)}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="labor">Labor</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(oi, ii)} disabled={opt.items.length <= 1}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addItem(oi)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Item
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addOption}>
        <Plus className="mr-1.5 h-4 w-4" />
        Add Option
      </Button>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {template ? "Save Changes" : "Create Template"}
        </Button>
      </div>
    </div>
  );
}
