"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  createEquipmentAction,
  updateEquipmentAction,
  type EquipmentActionState,
} from "@/actions/company-equipment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { showToast } from "@/lib/toast";

interface TeamMember {
  id: string;
  name: string;
}

interface EquipmentItem {
  id: string;
  name: string;
  type: string;
  serialNumber: string | null;
  brand: string | null;
  model: string | null;
  purchaseDate: string | null;
  purchaseCost: string | null;
  assignedTo: string | null;
  notes: string | null;
  status: string;
  serviceIntervalDays: number | null;
  serviceIntervalHours: number | null;
}

interface EquipmentFormProps {
  teamMembers: TeamMember[];
  item?: EquipmentItem;
}

const EQUIPMENT_TYPES = [
  "Vehicle",
  "Truck",
  "Trailer",
  "Mower",
  "Trimmer",
  "Blower",
  "Chainsaw",
  "Excavator",
  "Pressure Washer",
  "Generator",
  "Compressor",
  "Hand Tool",
  "Power Tool",
  "Safety Equipment",
  "Other",
];

const STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "in_use", label: "In Use" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
];

const initialState: EquipmentActionState = {};

export function EquipmentForm({ teamMembers, item }: EquipmentFormProps) {
  const isEdit = !!item;
  const action = isEdit ? updateEquipmentAction : createEquipmentAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const router = useRouter();
  const lastProcessedRef = useRef<string | null>(null);

  useEffect(() => {
    const stateKey = state.success
      ? `success-${state.itemId}`
      : state.error
        ? `error-${state.error}`
        : null;
    if (!stateKey || stateKey === lastProcessedRef.current) return;
    lastProcessedRef.current = stateKey;

    if (state.success) {
      if (isEdit) {
        showToast.saved("Equipment");
      } else {
        showToast.created("Equipment");
      }
      router.push("/settings/equipment");
    } else if (state.error) {
      showToast.error("Error", state.error);
    }
  }, [state.success, state.itemId, state.error, router, isEdit]);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Equipment" : "Equipment Details"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={item.id} />}

          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={item?.name || ""}
                placeholder="e.g. John Deere Z930M"
                aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
              />
              {state.fieldErrors?.name && (
                <p id="name-error" className="text-xs text-destructive" role="alert">
                  {state.fieldErrors.name[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select name="type" defaultValue={item?.type || "Other"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.fieldErrors?.type && (
                <p className="text-xs text-destructive" role="alert">
                  {state.fieldErrors.type[0]}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                name="brand"
                defaultValue={item?.brand || ""}
                placeholder="e.g. John Deere"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                name="model"
                defaultValue={item?.model || ""}
                placeholder="e.g. Z930M"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serialNumber">Serial Number</Label>
            <Input
              id="serialNumber"
              name="serialNumber"
              defaultValue={item?.serialNumber || ""}
              placeholder="e.g. 1TC930MCHLT060001"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                name="purchaseDate"
                type="date"
                defaultValue={item?.purchaseDate || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseCost">Purchase Cost</Label>
              <Input
                id="purchaseCost"
                name="purchaseCost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={item?.purchaseCost || ""}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select name="assignedTo" defaultValue={item?.assignedTo || "none"}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isEdit && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={item?.status || "available"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="serviceIntervalDays">Service Interval (days)</Label>
              <Input
                id="serviceIntervalDays"
                name="serviceIntervalDays"
                type="number"
                min="1"
                defaultValue={item?.serviceIntervalDays || ""}
                placeholder="e.g. 90"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceIntervalHours">Service Interval (hours)</Label>
              <Input
                id="serviceIntervalHours"
                name="serviceIntervalHours"
                type="number"
                min="1"
                defaultValue={item?.serviceIntervalHours || ""}
                placeholder="e.g. 250"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={item?.notes || ""}
              placeholder="Any additional notes about this equipment..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Equipment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
