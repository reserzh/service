"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createAgreementAction, type AgreementActionState } from "@/actions/agreements";
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
import { Loader2, Leaf } from "lucide-react";
import { showToast } from "@/lib/toast";
import { BILLING_FREQUENCY_LABELS, LANDSCAPING_SEASONAL_TEMPLATES, SEASON_LABELS } from "@fieldservice/api-types/constants";
import { useTradeType } from "@/lib/hooks/use-trade-type";

interface CustomerSummary {
  id: string;
  firstName: string;
  lastName: string;
}

const initialState: AgreementActionState = {};

export function CreateAgreementForm({ customers }: { customers: CustomerSummary[] }) {
  const [state, formAction, isPending] = useActionState(createAgreementAction, initialState);
  const router = useRouter();
  const lastProcessedRef = useRef<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const { isLandscaping } = useTradeType();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  useEffect(() => {
    const stateKey = state.success ? `success-${state.agreementId}` : state.error ? `error-${state.error}` : null;
    if (!stateKey || stateKey === lastProcessedRef.current) return;
    lastProcessedRef.current = stateKey;

    if (state.success && state.agreementId) {
      showToast.created("Agreement");
      router.push(`/agreements/${state.agreementId}`);
    } else if (state.error) {
      showToast.error("Error", state.error);
    }
  }, [state.success, state.agreementId, state.error, router]);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Agreement Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {state.error}
            </div>
          )}

          {isLandscaping && (
            <div className="rounded-lg border border-dashed border-green-300 bg-green-50/50 dark:bg-green-950/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                <Leaf className="h-4 w-4" />
                Seasonal Template
              </div>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Start from a seasonal template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {LANDSCAPING_SEASONAL_TEMPLATES.map((t) => (
                    <SelectItem key={t.season} value={t.season}>
                      {SEASON_LABELS[t.season]} — {t.frequency} ({t.visitsPerSeason} visits)
                    </SelectItem>
                  ))}
                  <SelectItem value="full-year">Full Year (all seasons, ~34 visits)</SelectItem>
                </SelectContent>
              </Select>
              {selectedTemplate && selectedTemplate !== "none" && (
                <div className="text-xs text-muted-foreground">
                  {selectedTemplate === "full-year" ? (
                    <span>Includes all 4 seasonal schedules with ~34 total visits per year.</span>
                  ) : (
                    (() => {
                      const t = LANDSCAPING_SEASONAL_TEMPLATES.find((t) => t.season === selectedTemplate);
                      return t ? (
                        <span>Services: {t.services.join(", ")} — {t.frequency}, {t.visitsPerSeason} visits/season</span>
                      ) : null;
                    })()
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Agreement Name *</Label>
            <Input id="name" name="name" required placeholder={isLandscaping ? "e.g. Annual Lawn Care Plan" : "e.g. Annual HVAC Maintenance"} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer *</Label>
              <Select name="customerId" value={selectedCustomer} onValueChange={setSelectedCustomer} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="propertyId">Property *</Label>
              <Input id="propertyId" name="propertyId" required placeholder="Property UUID" />
              <p className="text-xs text-muted-foreground">Enter the property ID</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="billingFrequency">Billing Frequency *</Label>
              <Select name="billingFrequency" defaultValue="annual">
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
              <Input id="visitsPerYear" name="visitsPerYear" type="number" min="0" required defaultValue="2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="billingAmount">Billing Amount *</Label>
              <Input id="billingAmount" name="billingAmount" type="number" step="0.01" min="0" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalValue">Total Value *</Label>
              <Input id="totalValue" name="totalValue" type="number" step="0.01" min="0" required />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch id="autoRenew" name="autoRenew" />
            <Label htmlFor="autoRenew">Auto-renew</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Agreement
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
