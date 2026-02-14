"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { updateServicesSettingsAction } from "@/actions/settings";
import { showToast } from "@/lib/toast";

const days = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

interface DayHours {
  open: string;
  close: string;
}

interface Settings {
  defaultTaxRate?: number;
  businessHours?: { [day: string]: DayHours | null };
  invoiceTerms?: string;
  estimateTerms?: string;
}

export function ServicesSettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const [taxRate, setTaxRate] = useState(
    settings.defaultTaxRate ? (settings.defaultTaxRate * 100).toString() : ""
  );

  const [businessHours, setBusinessHours] = useState<Record<string, DayHours | null>>(() => {
    const defaults: Record<string, DayHours | null> = {};
    for (const day of days) {
      defaults[day.key] = settings.businessHours?.[day.key] ?? { open: "08:00", close: "17:00" };
    }
    // Default weekends to closed
    if (!settings.businessHours?.saturday) defaults.saturday = null;
    if (!settings.businessHours?.sunday) defaults.sunday = null;
    return defaults;
  });

  const [invoiceTerms, setInvoiceTerms] = useState(settings.invoiceTerms ?? "");
  const [estimateTerms, setEstimateTerms] = useState(settings.estimateTerms ?? "");

  function toggleDay(key: string) {
    setBusinessHours((prev) => ({
      ...prev,
      [key]: prev[key] ? null : { open: "08:00", close: "17:00" },
    }));
  }

  function updateHours(key: string, field: "open" | "close", value: string) {
    setBusinessHours((prev) => ({
      ...prev,
      [key]: prev[key] ? { ...prev[key]!, [field]: value } : { open: "08:00", close: "17:00", [field]: value },
    }));
  }

  async function handleSave() {
    setIsPending(true);
    const result = await updateServicesSettingsAction({
      defaultTaxRate: taxRate ? Number(taxRate) / 100 : 0,
      businessHours,
      invoiceTerms: invoiceTerms || undefined,
      estimateTerms: estimateTerms || undefined,
    });
    setIsPending(false);

    if (result.error) {
      showToast.error("Failed to save settings", result.error);
    } else {
      showToast.saved("Settings");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Tax Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tax Rate</CardTitle>
          <CardDescription>Default tax rate applied to new invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 max-w-xs">
            <Input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="0"
              min={0}
              max={100}
              step={0.01}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Hours</CardTitle>
          <CardDescription>Set your operating hours for scheduling</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {days.map((day) => {
              const hours = businessHours[day.key];
              const isOpen = hours !== null;

              return (
                <div key={day.key} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-32">
                    <Switch
                      checked={isOpen}
                      onCheckedChange={() => toggleDay(day.key)}
                    />
                    <Label className="text-sm font-normal">{day.label}</Label>
                  </div>

                  {isOpen ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={hours?.open ?? "08:00"}
                        onChange={(e) => updateHours(day.key, "open", e.target.value)}
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={hours?.close ?? "17:00"}
                        onChange={(e) => updateHours(day.key, "close", e.target.value)}
                        className="w-32"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Closed</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Default Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Default Terms</CardTitle>
          <CardDescription>Default text shown on estimates and invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Estimate Terms & Conditions</Label>
            <Textarea
              value={estimateTerms}
              onChange={(e) => setEstimateTerms(e.target.value)}
              placeholder="e.g., This estimate is valid for 30 days..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Invoice Payment Terms</Label>
            <Textarea
              value={invoiceTerms}
              onChange={(e) => setInvoiceTerms(e.target.value)}
              placeholder="e.g., Payment is due within 30 days of invoice date..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
