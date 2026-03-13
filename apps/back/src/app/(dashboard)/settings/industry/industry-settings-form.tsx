"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Leaf,
  Flame,
  Droplets,
  Zap,
  Wrench,
  User,
  Users,
  Save,
  X,
  Plus,
} from "lucide-react";
import { updateIndustrySettingsAction } from "@/actions/settings";
import { showToast } from "@/lib/toast";
import {
  TRADE_TYPES,
  TRADE_TYPE_LABELS,
  DEFAULT_SERVICE_ZONES,
  type TradeType,
  type MeasurementUnit,
} from "@fieldservice/api-types/constants";

const TRADE_ICONS: Record<TradeType, typeof Leaf> = {
  landscaping: Leaf,
  hvac: Flame,
  plumbing: Droplets,
  electrical: Zap,
  general: Wrench,
};

interface Props {
  tradeType?: TradeType;
  operatorType?: "solo" | "crew";
  landscaping?: {
    defaultServiceZones?: string[];
    measurementUnit?: MeasurementUnit;
    seasonalScheduling?: boolean;
  };
}

export function IndustrySettingsForm({ tradeType: initialTrade, operatorType: initialOp, landscaping: initialLandscaping }: Props) {
  const [tradeType, setTradeType] = useState<TradeType>(initialTrade ?? "general");
  const [operatorType, setOperatorType] = useState<"solo" | "crew">(initialOp ?? "crew");
  const [saving, setSaving] = useState(false);

  // Landscaping-specific config
  const [zones, setZones] = useState<string[]>(initialLandscaping?.defaultServiceZones ?? []);
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>(initialLandscaping?.measurementUnit ?? "sqft");
  const [seasonalScheduling, setSeasonalScheduling] = useState(initialLandscaping?.seasonalScheduling ?? false);
  const [newZone, setNewZone] = useState("");

  const isLandscaping = tradeType === "landscaping";

  const addZone = () => {
    const trimmed = newZone.trim();
    if (trimmed && !zones.includes(trimmed)) {
      setZones([...zones, trimmed]);
      setNewZone("");
    }
  };

  const removeZone = (zone: string) => {
    setZones(zones.filter((z) => z !== zone));
  };

  const addDefaultZones = () => {
    const merged = [...new Set([...zones, ...DEFAULT_SERVICE_ZONES])];
    setZones(merged);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateIndustrySettingsAction({
      tradeType,
      operatorType,
      landscaping: isLandscaping
        ? {
            defaultServiceZones: zones,
            measurementUnit,
            seasonalScheduling,
          }
        : undefined,
    });
    setSaving(false);

    if (result.error) {
      showToast.error("Error", result.error);
    } else {
      showToast.saved("Industry settings");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Trade Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trade Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TRADE_TYPES.map((key) => {
              const Icon = TRADE_ICONS[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTradeType(key)}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors hover:border-primary/50 ${
                    tradeType === key
                      ? "border-primary bg-primary/5"
                      : "border-muted"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{TRADE_TYPE_LABELS[key]}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Operator Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operator Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOperatorType("solo")}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors hover:border-primary/50 ${
                operatorType === "solo"
                  ? "border-primary bg-primary/5"
                  : "border-muted"
              }`}
            >
              <User className="h-6 w-6" />
              <span className="text-sm font-medium">Solo Operator</span>
              <span className="text-xs text-muted-foreground">Just me</span>
            </button>
            <button
              type="button"
              onClick={() => setOperatorType("crew")}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors hover:border-primary/50 ${
                operatorType === "crew"
                  ? "border-primary bg-primary/5"
                  : "border-muted"
              }`}
            >
              <Users className="h-6 w-6" />
              <span className="text-sm font-medium">Crew / Team</span>
              <span className="text-xs text-muted-foreground">Multiple technicians</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Landscaping Config */}
      {isLandscaping && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Leaf className="h-4 w-4" />
              Landscaping Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Service Zones */}
            <div className="space-y-3">
              <Label>Default Service Zones</Label>
              <p className="text-xs text-muted-foreground">
                Define common property zones used when adding property details
              </p>
              <div className="flex flex-wrap gap-2">
                {zones.map((zone) => (
                  <Badge key={zone} variant="secondary" className="gap-1 pr-1">
                    {zone}
                    <button
                      type="button"
                      onClick={() => removeZone(zone)}
                      className="ml-1 rounded-full hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newZone}
                  onChange={(e) => setNewZone(e.target.value)}
                  placeholder="Add a zone..."
                  className="max-w-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addZone();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addZone}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {zones.length === 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={addDefaultZones}>
                  Load default zones
                </Button>
              )}
            </div>

            {/* Measurement Unit */}
            <div className="space-y-2">
              <Label htmlFor="measurementUnit">Measurement Unit</Label>
              <Select value={measurementUnit} onValueChange={(v) => setMeasurementUnit(v as MeasurementUnit)}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqft">Square Feet (sq ft)</SelectItem>
                  <SelectItem value="acre">Acres</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seasonal Scheduling */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="seasonalScheduling">Seasonal Scheduling</Label>
                <p className="text-xs text-muted-foreground">
                  Enable seasonal templates when creating service agreements
                </p>
              </div>
              <Switch
                id="seasonalScheduling"
                checked={seasonalScheduling}
                onCheckedChange={setSeasonalScheduling}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save */}
      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
