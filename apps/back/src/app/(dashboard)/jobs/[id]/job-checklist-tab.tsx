"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";
import {
  addChecklistItemAction,
  toggleChecklistItemAction,
  deleteChecklistItemAction,
} from "@/actions/jobs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, X, Loader2, Package } from "lucide-react";
import type { JobData } from "./job-detail-content";

interface JobChecklistTabProps {
  job: JobData;
}

export function JobChecklistTab({ job }: JobChecklistTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newChecklistLabel, setNewChecklistLabel] = useState("");
  const [showChecklistInput, setShowChecklistInput] = useState(false);
  const [newItemGroupName, setNewItemGroupName] = useState("");
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);

  const checklistItems = job.checklist.filter((i) => (i as Record<string, unknown>).itemType !== "equipment");
  const equipmentItems = job.checklist.filter((i) => (i as Record<string, unknown>).itemType === "equipment");
  const completedCount = checklistItems.filter((i) => i.completed).length;
  const equipmentCheckedCount = equipmentItems.filter((i) => i.completed).length;

  function handleAddChecklistItem() {
    if (!newChecklistLabel.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("label", newChecklistLabel.trim());
      if (newItemGroupName.trim()) {
        fd.set("groupName", newItemGroupName.trim());
      }
      const result = await addChecklistItemAction(job.id, fd);
      if (result.error) {
        showToast.error("Action failed", result.error);
      } else {
        showToast.created("Checklist item");
        setNewChecklistLabel("");
        setNewItemGroupName("");
        setShowNewGroupInput(false);
        setShowChecklistInput(false);
        router.refresh();
      }
    });
  }

  function handleToggleChecklistItem(itemId: string, completed: boolean) {
    startTransition(async () => {
      const result = await toggleChecklistItemAction(job.id, itemId, completed);
      if (result.error) {
        showToast.error("Action failed", result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleDeleteChecklistItem(itemId: string) {
    startTransition(async () => {
      const result = await deleteChecklistItemAction(job.id, itemId);
      if (result.error) {
        showToast.error("Action failed", result.error);
      } else {
        showToast.deleted("Checklist item");
        router.refresh();
      }
    });
  }

  function renderItemsCard(
    items: typeof job.checklist,
    completed: number,
    variant: "checklist" | "equipment" = "checklist"
  ) {
    const isEquipment = variant === "equipment";
    return (
      <Card>
        <CardContent className="pt-4">
          {/* Section label */}
          {isEquipment && (
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-semibold">Packing List</span>
            </div>
          )}
          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isEquipment ? "bg-orange-500" : "bg-primary"}`}
                style={{ width: `${items.length > 0 ? (completed / items.length) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {completed}/{items.length}{isEquipment ? " packed" : ""}
            </span>
          </div>

          {/* Grouped items */}
          {(() => {
            const groups: { name: string | null; order: number; items: typeof job.checklist }[] = [];
            const groupMap = new Map<string | null, typeof job.checklist>();
            const groupOrderMap = new Map<string | null, number>();

            for (const item of items) {
                const key = item.groupName;
                if (!groupMap.has(key)) {
                  groupMap.set(key, []);
                  groupOrderMap.set(key, item.groupSortOrder);
                }
                groupMap.get(key)!.push(item);
              }

              for (const [name, items] of groupMap.entries()) {
                groups.push({ name, order: groupOrderMap.get(name) ?? 0, items });
              }
              groups.sort((a, b) => a.order - b.order);

              const hasGroups = groups.some((g) => g.name !== null);

              return (
                <div className="space-y-4">
                  {groups.map((group) => {
                    const groupCompleted = group.items.filter((i) => i.completed).length;
                    return (
                      <div key={group.name ?? "__ungrouped"}>
                        {(hasGroups) && (
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              {group.name || "General"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {groupCompleted}/{group.items.length}
                            </span>
                          </div>
                        )}
                        <div className="space-y-1">
                          {group.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 group py-1.5">
                              <Checkbox
                                checked={item.completed}
                                onCheckedChange={(checked) =>
                                  handleToggleChecklistItem(item.id, checked === true)
                                }
                                disabled={isPending}
                              />
                              <span
                                className={`flex-1 text-sm ${
                                  item.completed ? "line-through text-muted-foreground" : ""
                                }`}
                              >
                                {item.label}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteChecklistItem(item.id)}
                                disabled={isPending}
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      );
  }

  return (
    <div className="space-y-4">
      {/* Equipment / Packing List */}
      {equipmentItems.length > 0 && renderItemsCard(equipmentItems, equipmentCheckedCount, "equipment")}

      {/* Checklist */}
      {checklistItems.length > 0 && renderItemsCard(checklistItems, completedCount, "checklist")}

      {/* Add item */}
      {showChecklistInput ? (
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={newChecklistLabel}
                onChange={(e) => setNewChecklistLabel(e.target.value)}
                placeholder="Enter checklist item..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddChecklistItem();
                  if (e.key === "Escape") {
                    setShowChecklistInput(false);
                    setNewChecklistLabel("");
                    setNewItemGroupName("");
                    setShowNewGroupInput(false);
                  }
                }}
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleAddChecklistItem}
                disabled={isPending || !newChecklistLabel.trim()}
              >
                {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowChecklistInput(false);
                  setNewChecklistLabel("");
                  setNewItemGroupName("");
                  setShowNewGroupInput(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {/* Group selector */}
            {(() => {
              const existingGroups = [...new Set(job.checklist.map((i) => i.groupName).filter(Boolean))] as string[];
              if (existingGroups.length === 0 && !showNewGroupInput) {
                return (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => setShowNewGroupInput(true)}
                  >
                    + Add to group
                  </Button>
                );
              }
              return (
                <div className="flex items-center gap-2">
                  {!showNewGroupInput && existingGroups.length > 0 ? (
                    <Select
                      value={newItemGroupName}
                      onValueChange={(val) => {
                        if (val === "__new__") {
                          setShowNewGroupInput(true);
                          setNewItemGroupName("");
                        } else {
                          setNewItemGroupName(val === "__none__" ? "" : val);
                        }
                      }}
                    >
                      <SelectTrigger className="w-48 h-8 text-xs">
                        <SelectValue placeholder="No group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No group</SelectItem>
                        {existingGroups.map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                        <SelectItem value="__new__">New group...</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        value={newItemGroupName}
                        onChange={(e) => setNewItemGroupName(e.target.value)}
                        placeholder="Group name..."
                        className="w-48 h-8 text-xs"
                      />
                      {existingGroups.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            setShowNewGroupInput(false);
                            setNewItemGroupName("");
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowChecklistInput(true)}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Item
        </Button>
      )}

      {job.checklist.length === 0 && !showChecklistInput && (
        <p className="text-sm text-muted-foreground text-center py-6">
          No checklist items yet.
        </p>
      )}
    </div>
  );
}
