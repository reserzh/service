"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createEstimateAction, type EstimateActionState } from "@/actions/estimates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, Plus, Trash2, Star } from "lucide-react";
import { showToast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";

interface Props {
  customers: { id: string; name: string }[];
}

type ItemType = "service" | "material" | "labor" | "discount" | "other";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  type: ItemType;
}

interface EstimateOption {
  name: string;
  description: string;
  isRecommended: boolean;
  items: LineItem[];
}

const defaultOption = (): EstimateOption => ({
  name: "",
  description: "",
  isRecommended: false,
  items: [{ description: "", quantity: 1, unitPrice: 0, type: "service" as ItemType }],
});

export function CreateEstimateForm({ customers }: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [properties, setProperties] = useState<{ id: string; address: string }[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [options, setOptions] = useState<EstimateOption[]>([
    { ...defaultOption(), name: "Good" },
    { ...defaultOption(), name: "Better", isRecommended: true },
    { ...defaultOption(), name: "Best" },
  ]);

  // Fetch properties when customer changes
  useEffect(() => {
    if (!selectedCustomer) {
      setProperties([]);
      setSelectedProperty("");
      return;
    }
    setLoadingProperties(true);
    fetch(`/api/v1/customers/${selectedCustomer}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.properties) {
          setProperties(
            data.data.properties.map((p: { id: string; addressLine1: string; city: string; state: string }) => ({
              id: p.id,
              address: `${p.addressLine1}, ${p.city}, ${p.state}`,
            }))
          );
        }
      })
      .catch(() => setProperties([]))
      .finally(() => setLoadingProperties(false));
  }, [selectedCustomer]);

  function updateOption(idx: number, updates: Partial<EstimateOption>) {
    setOptions((prev) => prev.map((opt, i) => (i === idx ? { ...opt, ...updates } : opt)));
  }

  function updateItem(optIdx: number, itemIdx: number, updates: Partial<LineItem>) {
    setOptions((prev) =>
      prev.map((opt, oi) =>
        oi === optIdx
          ? {
              ...opt,
              items: opt.items.map((item, ii) =>
                ii === itemIdx ? { ...item, ...updates } : item
              ),
            }
          : opt
      )
    );
  }

  function addItem(optIdx: number) {
    setOptions((prev) =>
      prev.map((opt, i) =>
        i === optIdx
          ? { ...opt, items: [...opt.items, { description: "", quantity: 1, unitPrice: 0, type: "service" as ItemType }] }
          : opt
      )
    );
  }

  function removeItem(optIdx: number, itemIdx: number) {
    setOptions((prev) =>
      prev.map((opt, i) =>
        i === optIdx ? { ...opt, items: opt.items.filter((_, ii) => ii !== itemIdx) } : opt
      )
    );
  }

  function addOption() {
    setOptions((prev) => [...prev, defaultOption()]);
  }

  function removeOption(idx: number) {
    if (options.length <= 1) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  }

  function setRecommended(idx: number) {
    setOptions((prev) =>
      prev.map((opt, i) => ({ ...opt, isRecommended: i === idx }))
    );
  }

  function getOptionTotal(opt: EstimateOption) {
    return opt.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    // Filter out options with no name and items with no description
    const cleanedOptions = options
      .filter((opt) => opt.name.trim())
      .map((opt) => ({
        ...opt,
        items: opt.items.filter((item) => item.description.trim()),
      }));

    if (cleanedOptions.length === 0 || cleanedOptions.some((opt) => opt.items.length === 0)) {
      setError("Each option must have a name and at least one line item.");
      setIsPending(false);
      return;
    }

    const result: EstimateActionState = await createEstimateAction({
      customerId: selectedCustomer,
      propertyId: selectedProperty,
      summary,
      notes: notes || undefined,
      validUntil: validUntil || undefined,
      options: cleanedOptions,
    });

    setIsPending(false);

    if (result.success && result.estimateId) {
      showToast.created("Estimate");
      router.push(`/estimates/${result.estimateId}`);
    } else if (result.error) {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Customer & Property */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer & Property</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Property *</Label>
              <Select
                value={selectedProperty}
                onValueChange={setSelectedProperty}
                disabled={!selectedCustomer || loadingProperties}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingProperties ? "Loading..." : "Select property"} />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.address}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estimate Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estimate Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Summary *</Label>
            <Input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g., HVAC System Replacement"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Valid Until</Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (visible to customer)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes for the customer..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Options (Good / Better / Best) */}
      {options.map((option, optIdx) => (
        <Card key={optIdx}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <Input
                value={option.name}
                onChange={(e) => updateOption(optIdx, { name: e.target.value })}
                placeholder="Option name (e.g., Good)"
                className="max-w-[200px] font-semibold"
              />
              {option.isRecommended && (
                <Badge variant="default" className="gap-1">
                  <Star className="h-3 w-3" /> Recommended
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!option.isRecommended && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setRecommended(optIdx)}>
                  <Star className="mr-1 h-3.5 w-3.5" /> Recommend
                </Button>
              )}
              {options.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removeOption(optIdx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={option.description}
                onChange={(e) => updateOption(optIdx, { description: e.target.value })}
                placeholder="Brief description of this option..."
              />
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Line Items</Label>
              <div className="space-y-2">
                {option.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-start gap-2">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(optIdx, itemIdx, { description: e.target.value })}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity || ""}
                      onChange={(e) => updateItem(optIdx, itemIdx, { quantity: Number(e.target.value) })}
                      className="w-20"
                      min={0.01}
                      step={0.01}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.unitPrice || ""}
                      onChange={(e) => updateItem(optIdx, itemIdx, { unitPrice: Number(e.target.value) })}
                      className="w-28"
                      min={0}
                      step={0.01}
                    />
                    <Select
                      value={item.type}
                      onValueChange={(v) => updateItem(optIdx, itemIdx, { type: v as ItemType })}
                    >
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-muted-foreground"
                      onClick={() => removeItem(optIdx, itemIdx)}
                      disabled={option.items.length <= 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => addItem(optIdx)}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add Item
                </Button>
                <p className="text-sm font-medium">
                  Total: ${getOptionTotal(option).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" onClick={addOption} className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Add Another Option
      </Button>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !selectedCustomer || !selectedProperty || !summary}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Estimate
        </Button>
      </div>
    </form>
  );
}
