"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addMaintenanceLogAction, type EquipmentActionState } from "@/actions/company-equipment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Loader2, Plus, ChevronDown } from "lucide-react";
import { showToast } from "@/lib/toast";

const MAINTENANCE_TYPES = [
  "Oil Change",
  "Filter Replacement",
  "Blade Sharpening",
  "Belt Replacement",
  "Tire Replacement",
  "Brake Service",
  "Engine Tune-Up",
  "Inspection",
  "Repair",
  "Cleaning",
  "Winterization",
  "Other",
];

const initialState: EquipmentActionState = {};

export function MaintenanceLogForm({ equipmentId }: { equipmentId: string }) {
  const [state, formAction, isPending] = useActionState(addMaintenanceLogAction, initialState);
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const lastProcessedRef = useRef<string | null>(null);

  useEffect(() => {
    const stateKey = state.success
      ? `success-${Date.now()}`
      : state.error
        ? `error-${state.error}`
        : null;
    if (!stateKey || stateKey === lastProcessedRef.current) return;
    lastProcessedRef.current = stateKey;

    if (state.success) {
      showToast.created("Maintenance log entry");
      formRef.current?.reset();
      setIsOpen(false);
    } else if (state.error) {
      showToast.error("Error", state.error);
    }
  }, [state.success, state.error]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm">
          {isOpen ? (
            <ChevronDown className="mr-2 h-4 w-4" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isOpen ? "Hide Form" : "Add Entry"}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">
        <form ref={formRef} action={formAction} className="space-y-3 rounded-lg border p-4">
          <input type="hidden" name="equipmentId" value={equipmentId} />

          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="maintenance-type">Type *</Label>
              <Select name="type" defaultValue="Inspection">
                <SelectTrigger id="maintenance-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAINTENANCE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="performedAt">Date *</Label>
              <Input
                id="performedAt"
                name="performedAt"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance-description">Description</Label>
            <Textarea
              id="maintenance-description"
              name="description"
              rows={2}
              placeholder="What was done..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="maintenance-cost">Cost</Label>
              <Input
                id="maintenance-cost"
                name="cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hoursAtService">Hours at Service</Label>
              <Input
                id="hoursAtService"
                name="hoursAtService"
                type="number"
                min="0"
                placeholder="e.g. 500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Entry
            </Button>
          </div>
        </form>
      </CollapsibleContent>
    </Collapsible>
  );
}
