"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { updateDashboardSettingsAction } from "@/actions/settings";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Check, Save } from "lucide-react";
import { DASHBOARD_PRESETS, type DashboardPresetId, type WidgetId } from "../../dashboard/layouts/types";

const WIDGET_OPTIONS: { id: WidgetId; label: string; description: string }[] = [
  { id: "stats", label: "Stats Cards", description: "KPI cards showing today's jobs, revenue, estimates, overdue" },
  { id: "quick-actions", label: "Quick Actions", description: "Shortcut buttons for creating jobs, estimates, invoices" },
  { id: "schedule", label: "Today's Schedule", description: "Upcoming jobs for today" },
  { id: "activity", label: "Recent Activity", description: "Activity feed showing recent actions" },
  { id: "chart", label: "Revenue Chart", description: "Visual chart for revenue data (Mission Control, Glass)" },
  { id: "team", label: "Technician Grid", description: "Grid showing assigned technicians (Blueprint)" },
];

export function DashboardSettingsForm({
  currentPreset,
  currentHiddenWidgets,
}: {
  currentPreset: string;
  currentHiddenWidgets: string[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [preset, setPreset] = useState<DashboardPresetId>(currentPreset as DashboardPresetId);
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(new Set(currentHiddenWidgets));

  const activePreset = DASHBOARD_PRESETS.find((p) => p.id === preset);

  const toggleWidget = (widgetId: string) => {
    setHiddenWidgets((prev) => {
      const next = new Set(prev);
      if (next.has(widgetId)) {
        next.delete(widgetId);
      } else {
        next.add(widgetId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateDashboardSettingsAction({
        dashboardPreset: preset,
        dashboardHiddenWidgets: Array.from(hiddenWidgets),
      });
      if (result.error) {
        showToast.error(result.error);
      } else {
        showToast.saved("Dashboard settings");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Preset Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Layout Preset</CardTitle>
          <CardDescription>Select a dashboard layout that fits your workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {DASHBOARD_PRESETS.map((p) => {
              const isActive = preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreset(p.id)}
                  className={cn(
                    "relative rounded-lg border p-3 text-left transition-all hover:border-primary/50 hover:shadow-sm",
                    isActive && "border-primary ring-2 ring-primary/20"
                  )}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className="mb-2 flex gap-1.5">
                    {p.colors.map((color, i) => (
                      <span
                        key={i}
                        className="h-5 w-5 rounded-full border"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <p className="text-sm font-medium leading-tight">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Widget Visibility */}
      <Card>
        <CardHeader>
          <CardTitle>Widget Visibility</CardTitle>
          <CardDescription>
            Choose which sections to show on your dashboard. Unsupported widgets for the selected preset are dimmed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {WIDGET_OPTIONS.map((widget) => {
              const supported = activePreset?.supportedWidgets.includes(widget.id) ?? false;
              const isHidden = hiddenWidgets.has(widget.id);
              return (
                <div
                  key={widget.id}
                  className={cn(
                    "flex items-start gap-3",
                    !supported && "opacity-40"
                  )}
                >
                  <Checkbox
                    id={widget.id}
                    checked={!isHidden && supported}
                    disabled={!supported}
                    onCheckedChange={() => toggleWidget(widget.id)}
                  />
                  <div className="grid gap-0.5 leading-none">
                    <Label htmlFor={widget.id} className="text-sm font-medium cursor-pointer">
                      {widget.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{widget.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pb-6">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
