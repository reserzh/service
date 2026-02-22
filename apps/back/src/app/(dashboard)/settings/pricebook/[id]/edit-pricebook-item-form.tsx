"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { updatePricebookItemAction, deletePricebookItemAction, type PricebookActionState } from "@/actions/pricebook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";
import { showToast } from "@/lib/toast";
import { LINE_ITEM_TYPE_LABELS } from "@fieldservice/api-types/constants";
import { useState } from "react";

interface PricebookItem {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  category: string | null;
  type: string;
  unitPrice: string;
  unit: string | null;
  costPrice: string | null;
  taxable: boolean;
  isActive: boolean;
}

const initialState: PricebookActionState = {};

export function EditPricebookItemForm({ item }: { item: PricebookItem }) {
  const [state, formAction, isPending] = useActionState(updatePricebookItemAction, initialState);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const lastProcessedRef = useRef<string | null>(null);

  useEffect(() => {
    const stateKey = state.success ? `success-${Date.now()}` : state.error ? `error-${state.error}` : null;
    if (!stateKey || stateKey === lastProcessedRef.current) return;
    lastProcessedRef.current = stateKey;

    if (state.success) {
      showToast.saved("Pricebook item");
      router.push("/settings/pricebook");
    } else if (state.error) {
      showToast.error("Error", state.error);
    }
  }, [state.success, state.error, router]);

  async function handleDelete() {
    if (!confirm("Are you sure you want to deactivate this item?")) return;
    setIsDeleting(true);
    const result = await deletePricebookItemAction(item.id);
    if (result.success) {
      showToast.deleted("Pricebook item");
      router.push("/settings/pricebook");
    } else if (result.error) {
      showToast.error("Error", result.error);
    }
    setIsDeleting(false);
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Edit Item</CardTitle>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Deactivate
        </Button>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={item.id} />

          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required defaultValue={item.name} />
            {state.fieldErrors?.name && (
              <p className="text-xs text-destructive" role="alert">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} defaultValue={item.description || ""} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" defaultValue={item.sku || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" defaultValue={item.category || ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue={item.type}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LINE_ITEM_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" name="unit" defaultValue={item.unit || ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price *</Label>
              <Input id="unitPrice" name="unitPrice" type="number" step="0.01" min="0" required defaultValue={item.unitPrice} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price</Label>
              <Input id="costPrice" name="costPrice" type="number" step="0.01" min="0" defaultValue={item.costPrice || ""} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch id="taxable" name="taxable" defaultChecked={item.taxable} />
            <Label htmlFor="taxable">Taxable</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
