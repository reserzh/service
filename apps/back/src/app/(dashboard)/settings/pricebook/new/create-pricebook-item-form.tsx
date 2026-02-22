"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPricebookItemAction, type PricebookActionState } from "@/actions/pricebook";
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
import { Loader2 } from "lucide-react";
import { showToast } from "@/lib/toast";
import { LINE_ITEM_TYPE_LABELS } from "@fieldservice/api-types/constants";

const initialState: PricebookActionState = {};

export function CreatePricebookItemForm() {
  const [state, formAction, isPending] = useActionState(createPricebookItemAction, initialState);
  const router = useRouter();
  const lastProcessedRef = useRef<string | null>(null);

  useEffect(() => {
    const stateKey = state.success ? `success-${state.itemId}` : state.error ? `error-${state.error}` : null;
    if (!stateKey || stateKey === lastProcessedRef.current) return;
    lastProcessedRef.current = stateKey;

    if (state.success) {
      showToast.created("Pricebook item");
      router.push("/settings/pricebook");
    } else if (state.error) {
      showToast.error("Error", state.error);
    }
  }, [state.success, state.itemId, state.error, router]);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Item Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required aria-describedby={state.fieldErrors?.name ? "name-error" : undefined} />
            {state.fieldErrors?.name && (
              <p id="name-error" className="text-xs text-destructive" role="alert">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" placeholder="e.g. SVC-001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" placeholder="e.g. HVAC, Plumbing" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue="service">
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
              <Input id="unit" name="unit" placeholder="e.g. each, hour, ft" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price *</Label>
              <Input id="unitPrice" name="unitPrice" type="number" step="0.01" min="0" required />
              {state.fieldErrors?.unitPrice && (
                <p className="text-xs text-destructive" role="alert">{state.fieldErrors.unitPrice[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price</Label>
              <Input id="costPrice" name="costPrice" type="number" step="0.01" min="0" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch id="taxable" name="taxable" defaultChecked />
            <Label htmlFor="taxable">Taxable</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Item
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
