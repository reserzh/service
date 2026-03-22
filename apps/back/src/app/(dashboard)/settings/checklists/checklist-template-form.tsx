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
import { Plus, Trash2, GripVertical, Loader2 } from "lucide-react";

interface GroupedItem {
  label: string;
  groupName: string;
}

interface TemplateData {
  id?: string;
  name: string;
  description: string | null;
  templateType: "checklist" | "equipment";
  jobType: string | null;
  isActive: boolean;
  autoApplyOnDispatch: boolean;
  items: { id: string; label: string; groupName: string | null }[];
}

interface Props {
  template?: TemplateData;
  saveAction: (data: {
    name: string;
    description?: string;
    templateType?: "checklist" | "equipment";
    jobType?: string;
    isActive?: boolean;
    autoApplyOnDispatch?: boolean;
    items: { label: string; groupName?: string }[];
  }) => Promise<{ error?: string }>;
}

interface GroupState {
  name: string;
  items: string[];
}

function buildGroupsFromTemplate(template?: TemplateData): GroupState[] {
  if (!template || template.items.length === 0) {
    return [{ name: "", items: [""] }];
  }

  const groupMap = new Map<string, string[]>();
  const groupOrder: string[] = [];

  for (const item of template.items) {
    const key = item.groupName ?? "";
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
      groupOrder.push(key);
    }
    groupMap.get(key)!.push(item.label);
  }

  return groupOrder.map((name) => ({
    name,
    items: groupMap.get(name) ?? [""],
  }));
}

export function ChecklistTemplateForm({ template, saveAction }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(template?.name ?? "");
  const [templateType, setTemplateType] = useState<"checklist" | "equipment">(
    template?.templateType ?? "checklist"
  );
  const [description, setDescription] = useState(template?.description ?? "");
  const [jobType, setJobType] = useState(template?.jobType ?? "");
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [autoApplyOnDispatch, setAutoApplyOnDispatch] = useState(
    template?.autoApplyOnDispatch ?? false
  );
  const [groups, setGroups] = useState<GroupState[]>(
    buildGroupsFromTemplate(template)
  );

  function addGroup() {
    setGroups([...groups, { name: "", items: [""] }]);
  }

  function removeGroup(groupIdx: number) {
    setGroups(groups.filter((_, i) => i !== groupIdx));
  }

  function updateGroupName(groupIdx: number, value: string) {
    const updated = [...groups];
    updated[groupIdx] = { ...updated[groupIdx], name: value };
    setGroups(updated);
  }

  function addItemToGroup(groupIdx: number) {
    const updated = [...groups];
    updated[groupIdx] = {
      ...updated[groupIdx],
      items: [...updated[groupIdx].items, ""],
    };
    setGroups(updated);
  }

  function removeItemFromGroup(groupIdx: number, itemIdx: number) {
    const updated = [...groups];
    updated[groupIdx] = {
      ...updated[groupIdx],
      items: updated[groupIdx].items.filter((_, i) => i !== itemIdx),
    };
    // If group has no items left, remove the group
    if (updated[groupIdx].items.length === 0) {
      updated.splice(groupIdx, 1);
    }
    setGroups(updated);
  }

  function updateItemInGroup(groupIdx: number, itemIdx: number, value: string) {
    const updated = [...groups];
    const items = [...updated[groupIdx].items];
    items[itemIdx] = value;
    updated[groupIdx] = { ...updated[groupIdx], items };
    setGroups(updated);
  }

  function handleSubmit() {
    if (!name.trim()) {
      showToast.error("Validation", "Template name is required");
      return;
    }

    // Flatten groups into items
    const flatItems: { label: string; groupName?: string }[] = [];
    for (const group of groups) {
      for (const item of group.items) {
        if (item.trim()) {
          flatItems.push({
            label: item.trim(),
            groupName: group.name.trim() || undefined,
          });
        }
      }
    }

    if (flatItems.length === 0) {
      showToast.error("Validation", "At least one checklist item is required");
      return;
    }

    startTransition(async () => {
      const result = await saveAction({
        name: name.trim(),
        description: description.trim() || undefined,
        templateType,
        jobType: jobType.trim() || undefined,
        isActive,
        autoApplyOnDispatch,
        items: flatItems,
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
            <Label htmlFor="templateType">Template Type</Label>
            <Select value={templateType} onValueChange={(v) => setTemplateType(v as "checklist" | "equipment")}>
              <SelectTrigger id="templateType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checklist">Checklist (tasks to complete)</SelectItem>
                <SelectItem value="equipment">Equipment List (tools/items to bring)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., HVAC Install Checklist"
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
              placeholder="e.g., HVAC Install"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={autoApplyOnDispatch}
              onCheckedChange={setAutoApplyOnDispatch}
            />
            <Label>Auto-apply on dispatch</Label>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            When enabled, this checklist will be automatically added to jobs of
            the matching type when they are dispatched.
          </p>
          {template && (
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Active</Label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grouped checklist items */}
      {groups.map((group, groupIdx) => (
        <Card key={groupIdx}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Input
                value={group.name}
                onChange={(e) => updateGroupName(groupIdx, e.target.value)}
                placeholder="Group name (optional)"
                className="text-sm font-medium h-8"
              />
              {groups.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeGroup(groupIdx)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {group.items.map((item, itemIdx) => (
              <div key={itemIdx} className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  value={item}
                  onChange={(e) =>
                    updateItemInGroup(groupIdx, itemIdx, e.target.value)
                  }
                  placeholder={`Item ${itemIdx + 1}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItemToGroup(groupIdx);
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeItemFromGroup(groupIdx, itemIdx)}
                  disabled={group.items.length <= 1 && groups.length <= 1}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addItemToGroup(groupIdx)}
              className="mt-2"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Item
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" size="sm" onClick={addGroup}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Add Group
      </Button>

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
