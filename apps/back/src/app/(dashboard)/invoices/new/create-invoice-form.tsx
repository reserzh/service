"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInvoiceAction, type InvoiceActionState } from "@/actions/invoices";
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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { addDays, format } from "date-fns";
import { showToast } from "@/lib/toast";

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

export function CreateInvoiceForm({ customers }: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 30), "yyyy-MM-dd"));
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0, type: "service" as ItemType },
  ]);

  function updateItem(idx: number, updates: Partial<LineItem>) {
    setLineItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...updates } : item)));
  }

  function addItem() {
    setLineItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0, type: "service" as ItemType }]);
  }

  function removeItem(idx: number) {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const cleanedItems = lineItems.filter((item) => item.description.trim());
    if (cleanedItems.length === 0) {
      setError("At least one line item is required.");
      setIsPending(false);
      return;
    }

    const result: InvoiceActionState = await createInvoiceAction({
      customerId: selectedCustomer,
      dueDate,
      taxRate: taxRate || undefined,
      notes: notes || undefined,
      lineItems: cleanedItems,
    });

    setIsPending(false);

    if (result.success && result.invoiceId) {
      showToast.created("Invoice");
      router.push(`/invoices/${result.invoiceId}`);
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

      {/* Customer & Due Date */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Details</CardTitle>
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
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                value={taxRate * 100 || ""}
                onChange={(e) => setTaxRate(Number(e.target.value) / 100)}
                placeholder="0"
                min={0}
                max={100}
                step={0.01}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms, notes for the customer..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lineItems.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <Input
                placeholder="Description"
                value={item.description}
                onChange={(e) => updateItem(idx, { description: e.target.value })}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Qty"
                value={item.quantity || ""}
                onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                className="w-20"
                min={0.01}
                step={0.01}
              />
              <Input
                type="number"
                placeholder="Price"
                value={item.unitPrice || ""}
                onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                className="w-28"
                min={0}
                step={0.01}
              />
              <Select
                value={item.type}
                onValueChange={(v) => updateItem(idx, { type: v as ItemType })}
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
                onClick={() => removeItem(idx)}
                disabled={lineItems.length <= 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add Item
          </Button>

          {/* Totals */}
          <div className="border-t pt-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({(taxRate * 100).toFixed(2)}%)</span>
                <span>${taxAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !selectedCustomer || !dueDate}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Invoice
        </Button>
      </div>
    </form>
  );
}
