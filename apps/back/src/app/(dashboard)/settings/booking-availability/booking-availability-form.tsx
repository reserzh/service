"use client";

import { useState, useActionState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { updateQuoteAvailabilityAction } from "@/actions/settings";
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

type TimeWindow = { start: string; end: string };

type QuoteAvailability = {
  enabled: boolean;
  windows: { [day: string]: TimeWindow[] | null };
  leadTimeDays?: number;
  maxAdvanceDays?: number;
};

const defaultWindows: Record<string, TimeWindow[] | null> = {
  monday: [{ start: "08:00", end: "17:00" }],
  tuesday: [{ start: "08:00", end: "17:00" }],
  wednesday: [{ start: "08:00", end: "17:00" }],
  thursday: [{ start: "08:00", end: "17:00" }],
  friday: [{ start: "08:00", end: "17:00" }],
  saturday: null,
  sunday: null,
};

export function BookingAvailabilityForm({
  quoteAvailability,
}: {
  quoteAvailability?: QuoteAvailability;
}) {
  const [enabled, setEnabled] = useState(quoteAvailability?.enabled ?? false);
  const [windows, setWindows] = useState<Record<string, TimeWindow[] | null>>(
    () => {
      const result: Record<string, TimeWindow[] | null> = {};
      for (const day of days) {
        result[day.key] = quoteAvailability?.windows?.[day.key] ?? defaultWindows[day.key] ?? null;
      }
      return result;
    }
  );
  const [leadTimeDays, setLeadTimeDays] = useState(
    quoteAvailability?.leadTimeDays?.toString() ?? "1"
  );
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(
    quoteAvailability?.maxAdvanceDays?.toString() ?? "60"
  );

  const [state, formAction, isPending] = useActionState(
    updateQuoteAvailabilityAction,
    {} as { error?: string; success?: boolean }
  );

  useEffect(() => {
    if (state.success) {
      showToast.saved("Booking availability");
    } else if (state.error) {
      showToast.error("Failed to save", state.error);
    }
  }, [state.success, state.error]);

  function toggleDay(key: string) {
    setWindows((prev) => ({
      ...prev,
      [key]: prev[key] ? null : [{ start: "08:00", end: "17:00" }],
    }));
  }

  function addWindow(key: string) {
    setWindows((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), { start: "12:00", end: "17:00" }],
    }));
  }

  function removeWindow(key: string, index: number) {
    setWindows((prev) => {
      const current = prev[key];
      if (!current || current.length <= 1) {
        return { ...prev, [key]: null };
      }
      return { ...prev, [key]: current.filter((_, i) => i !== index) };
    });
  }

  function updateWindow(
    key: string,
    index: number,
    field: "start" | "end",
    value: string
  ) {
    setWindows((prev) => {
      const current = prev[key];
      if (!current) return prev;
      const updated = current.map((w, i) =>
        i === index ? { ...w, [field]: value } : w
      );
      return { ...prev, [key]: updated };
    });
  }

  function handleSubmit(formData: FormData) {
    const data: QuoteAvailability = {
      enabled,
      windows,
      leadTimeDays: leadTimeDays ? parseInt(leadTimeDays, 10) : undefined,
      maxAdvanceDays: maxAdvanceDays ? parseInt(maxAdvanceDays, 10) : undefined,
    };
    formData.set("data", JSON.stringify(data));
    formAction(formData);
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Enable / Disable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enable Booking Availability</CardTitle>
          <CardDescription>
            When enabled, your public booking page will only show time slots
            within the configured windows. When disabled, customers can request
            any date and time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <Label className="text-sm">
              {enabled ? "Availability restrictions active" : "No restrictions (any time)"}
            </Label>
          </div>
        </CardContent>
      </Card>

      {enabled && (
        <>
          {/* Time Windows */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Available Time Windows</CardTitle>
              <CardDescription>
                Set the hours when customers can book appointments for each day
                of the week. You can add multiple windows per day (e.g., morning
                and afternoon blocks).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {days.map((day) => {
                  const dayWindows = windows[day.key];
                  const isOpen = dayWindows !== null && dayWindows !== undefined;

                  return (
                    <div key={day.key} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={isOpen}
                          onCheckedChange={() => toggleDay(day.key)}
                        />
                        <Label className="text-sm font-medium w-28">
                          {day.label}
                        </Label>
                        {!isOpen && (
                          <span className="text-sm text-muted-foreground">
                            Unavailable
                          </span>
                        )}
                      </div>

                      {isOpen && dayWindows && (
                        <div className="ml-14 space-y-2">
                          {dayWindows.map((window, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2"
                            >
                              <Input
                                type="time"
                                value={window.start}
                                onChange={(e) =>
                                  updateWindow(day.key, idx, "start", e.target.value)
                                }
                                className="w-32"
                              />
                              <span className="text-sm text-muted-foreground">
                                to
                              </span>
                              <Input
                                type="time"
                                value={window.end}
                                onChange={(e) =>
                                  updateWindow(day.key, idx, "end", e.target.value)
                                }
                                className="w-32"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => removeWindow(day.key, idx)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-1"
                            onClick={() => addWindow(day.key)}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add Window
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Scheduling Constraints */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scheduling Constraints</CardTitle>
              <CardDescription>
                Control how far in advance customers can book and the minimum
                lead time required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
                <div className="space-y-2">
                  <Label>Minimum Lead Time (days)</Label>
                  <Input
                    type="number"
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(e.target.value)}
                    min={0}
                    max={90}
                    placeholder="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    How many days in advance a booking must be made (0 = same day)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Maximum Advance Booking (days)</Label>
                  <Input
                    type="number"
                    value={maxAdvanceDays}
                    onChange={(e) => setMaxAdvanceDays(e.target.value)}
                    min={1}
                    max={365}
                    placeholder="60"
                  />
                  <p className="text-xs text-muted-foreground">
                    How far into the future customers can book
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </form>
  );
}
