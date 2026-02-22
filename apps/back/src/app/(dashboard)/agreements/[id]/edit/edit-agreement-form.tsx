"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateAgreementAction, type AgreementActionState } from "@/actions/agreements";
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
import { BILLING_FREQUENCY_LABELS } from "@fieldservice/api-types/constants";

interface AgreementData {
  id: string;
  agreementNumber: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  billingFrequency: string;
  billingAmount: string;
  totalValue: string;
  visitsPerYear: number;
  autoRenew: boolean;
  renewalReminderDays: number;
  notes: string | null;
  internalNotes: string | null;
}

const initialState: AgreementActionState = {};

export function EditAgreementForm({ agreement }: { agreement: AgreementData }) {
  const [state, formAction, isPending] = useActionState(updateAgreementAction, initialState);
  const router = useRouter();
  const lastProcessedRef = useRef<string | null>(null);

  useEffect(() => {
    const stateKey = state.success ? `success-${state.agreementId}` : state.error ? `error-${state.error}` : null;
    if (!stateKey || stateKey === lastProcessedRef.current) return;
    lastProcessedRef.current = stateKey;

    if (state.success) {
      showToast.saved("Agreement");
      router.push(`/agreements/${agreement.id}`);
    } else if (state.error) {
      showToast.error("Error", state.error);
    }
  }, [state.success, state.agreementId, state.error, router, agreement.id]);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Edit Agreement</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={agreement.id} />

          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Agreement Name *</Label>
            <Input id="name" name="name" required defaultValue={agreement.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} defaultValue={agreement.description || ""} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input id="startDate" name="startDate" type="date" required defaultValue={agreement.startDate} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input id="endDate" name="endDate" type="date" required defaultValue={agreement.endDate} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="billingFrequency">Billing Frequency *</Label>
              <Select name="billingFrequency" defaultValue={agreement.billingFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BILLING_FREQUENCY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="visitsPerYear">Visits Per Year *</Label>
              <Input id="visitsPerYear" name="visitsPerYear" type="number" min="0" required defaultValue={agreement.visitsPerYear} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="billingAmount">Billing Amount *</Label>
              <Input id="billingAmount" name="billingAmount" type="number" step="0.01" min="0" required defaultValue={parseFloat(agreement.billingAmount).toFixed(2)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalValue">Total Value *</Label>
              <Input id="totalValue" name="totalValue" type="number" step="0.01" min="0" required defaultValue={parseFloat(agreement.totalValue).toFixed(2)} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch id="autoRenew" name="autoRenew" defaultChecked={agreement.autoRenew} />
            <Label htmlFor="autoRenew">Auto-renew</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={agreement.notes || ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="internalNotes">Internal Notes</Label>
            <Textarea id="internalNotes" name="internalNotes" rows={2} defaultValue={agreement.internalNotes || ""} />
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
