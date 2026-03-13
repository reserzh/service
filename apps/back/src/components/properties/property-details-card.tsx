"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ruler, Save, Plus, X } from "lucide-react";
import { useTradeType } from "@/lib/hooks/use-trade-type";
import { showToast } from "@/lib/toast";
import {
  IRRIGATION_TYPE_LABELS,
  SLOPE_TYPE_LABELS,
  COMMON_OBSTACLES,
  type PropertyMetadata,
  type IrrigationType,
  type SlopeType,
  type ServiceZone,
} from "@fieldservice/api-types/constants";

interface Props {
  propertyId: string;
  lotSizeSqft?: number | null;
  lawnAreaSqft?: number | null;
  propertyMetadata?: PropertyMetadata | null;
}

export function PropertyDetailsCard({ propertyId, lotSizeSqft, lawnAreaSqft, propertyMetadata }: Props) {
  const { isLandscaping } = useTradeType();
  const meta = propertyMetadata ?? {};

  const [lotSize, setLotSize] = useState(lotSizeSqft?.toString() ?? "");
  const [lawnArea, setLawnArea] = useState(lawnAreaSqft?.toString() ?? "");
  const [gateCode, setGateCode] = useState(meta.gateCode ?? "");
  const [obstacles, setObstacles] = useState<string[]>(meta.obstacles ?? []);
  const [irrigationType, setIrrigationType] = useState<IrrigationType>(meta.irrigationType ?? "none");
  const [grassType, setGrassType] = useState(meta.grassType ?? "");
  const [slope, setSlope] = useState<SlopeType>(meta.slope ?? "flat");
  const [zones, setZones] = useState<ServiceZone[]>(meta.serviceZones ?? []);
  const [saving, setSaving] = useState(false);
  const [newObstacle, setNewObstacle] = useState("");

  const addObstacle = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !obstacles.includes(trimmed)) {
      setObstacles([...obstacles, trimmed]);
      setNewObstacle("");
    }
  };

  const addZone = () => {
    setZones([...zones, { name: "", areaSqft: undefined, notes: "" }]);
  };

  const updateZone = (index: number, field: keyof ServiceZone, value: string | number | undefined) => {
    setZones(zones.map((z, i) => (i === index ? { ...z, [field]: value } : z)));
  };

  const removeZone = (index: number) => {
    setZones(zones.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const metadata: PropertyMetadata = {
        gateCode: gateCode || undefined,
        obstacles: obstacles.length > 0 ? obstacles : undefined,
        ...(isLandscaping && {
          irrigationType,
          grassType: grassType || undefined,
          slope,
          serviceZones: zones.filter((z) => z.name.trim()),
        }),
      };

      const res = await fetch(`/api/v1/properties/${propertyId}/measurements`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotSizeSqft: lotSize ? parseInt(lotSize, 10) : null,
          lawnAreaSqft: isLandscaping && lawnArea ? parseInt(lawnArea, 10) : null,
          propertyMetadata: metadata,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      showToast.saved("Property details");
    } catch {
      showToast.error("Error", "Failed to save property details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Ruler className="h-4 w-4" />
          Property Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic fields (all trades) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lotSize">Lot Size (sq ft)</Label>
            <Input
              id="lotSize"
              type="number"
              value={lotSize}
              onChange={(e) => setLotSize(e.target.value)}
              placeholder="e.g. 8000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gateCode">Gate Code</Label>
            <Input
              id="gateCode"
              value={gateCode}
              onChange={(e) => setGateCode(e.target.value)}
              placeholder="e.g. #1234"
            />
          </div>
        </div>

        {/* Obstacles (all trades) */}
        <div className="space-y-2">
          <Label>Obstacles</Label>
          <div className="flex flex-wrap gap-2">
            {obstacles.map((obs) => (
              <Badge key={obs} variant="secondary" className="gap-1 pr-1">
                {obs}
                <button
                  type="button"
                  onClick={() => setObstacles(obstacles.filter((o) => o !== obs))}
                  className="ml-1 rounded-full hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_OBSTACLES.filter((o) => !obstacles.includes(o)).map((o) => (
              <Button
                key={o}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => addObstacle(o)}
              >
                + {o}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newObstacle}
              onChange={(e) => setNewObstacle(e.target.value)}
              placeholder="Custom obstacle..."
              className="max-w-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addObstacle(newObstacle);
                }
              }}
            />
          </div>
        </div>

        {/* Landscaping-only fields */}
        {isLandscaping && (
          <>
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-4">Landscaping Details</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="lawnArea">Lawn Area (sq ft)</Label>
                  <Input
                    id="lawnArea"
                    type="number"
                    value={lawnArea}
                    onChange={(e) => setLawnArea(e.target.value)}
                    placeholder="e.g. 5000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grassType">Grass Type</Label>
                  <Input
                    id="grassType"
                    value={grassType}
                    onChange={(e) => setGrassType(e.target.value)}
                    placeholder="e.g. Bermuda, Fescue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Irrigation Type</Label>
                  <Select value={irrigationType} onValueChange={(v) => setIrrigationType(v as IrrigationType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(IRRIGATION_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Slope</Label>
                  <Select value={slope} onValueChange={(v) => setSlope(v as SlopeType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SLOPE_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Service Zones */}
              <div className="space-y-3">
                <Label>Service Zones</Label>
                {zones.map((zone, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={zone.name}
                      onChange={(e) => updateZone(i, "name", e.target.value)}
                      placeholder="Zone name"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={zone.areaSqft ?? ""}
                      onChange={(e) =>
                        updateZone(i, "areaSqft", e.target.value ? parseInt(e.target.value, 10) : undefined)
                      }
                      placeholder="Area (sq ft)"
                      className="w-32"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeZone(i)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addZone}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Zone
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Save */}
        <div className="flex items-center gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Details"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
