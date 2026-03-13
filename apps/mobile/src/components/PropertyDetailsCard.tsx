import { View, Text } from "react-native";
import { Ruler, Droplets, Trees, Triangle, Lock, AlertTriangle } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { useSettingsStore } from "@/stores/settings";
import type { PropertyMetadata } from "@fieldservice/api-types/constants";

interface Props {
  lotSizeSqft?: number | null;
  lawnAreaSqft?: number | null;
  propertyMetadata?: PropertyMetadata | null;
}

function formatArea(sqft: number): string {
  if (sqft >= 43560) {
    return `${(sqft / 43560).toFixed(2)} acres`;
  }
  return `${sqft.toLocaleString()} sq ft`;
}

export function PropertyDetailsCard({ lotSizeSqft, lawnAreaSqft, propertyMetadata }: Props) {
  const tradeType = useSettingsStore((s) => s.tradeType);
  const isLandscaping = tradeType === "landscaping";
  const meta = propertyMetadata ?? {};

  const hasBasicData = lotSizeSqft || meta.gateCode || (meta.obstacles && meta.obstacles.length > 0);
  const hasLandscapingData = lawnAreaSqft || meta.irrigationType || meta.grassType || meta.slope || (meta.serviceZones && meta.serviceZones.length > 0);

  if (!hasBasicData && !(isLandscaping && hasLandscapingData)) return null;

  const textSize = "text-base";
  const labelSize = "text-sm";
  const iconSize = 18;

  return (
    <Card>
      <Text className={`${labelSize} font-medium text-slate-500 uppercase tracking-wide mb-3`}>
        Property Details
      </Text>

      {/* Basic info row */}
      <View className="flex-row flex-wrap gap-x-6 gap-y-2 mb-2">
        {lotSizeSqft && (
          <View className="flex-row items-center gap-1.5">
            <Ruler size={iconSize} color="#64748b" />
            <Text className={`${textSize} text-slate-700 dark:text-slate-300`}>
              Lot: {formatArea(lotSizeSqft)}
            </Text>
          </View>
        )}
        {meta.gateCode && (
          <View className="flex-row items-center gap-1.5">
            <Lock size={iconSize} color="#64748b" />
            <Text className={`${textSize} text-slate-700 dark:text-slate-300`}>
              Gate: {meta.gateCode}
            </Text>
          </View>
        )}
      </View>

      {/* Obstacles */}
      {meta.obstacles && meta.obstacles.length > 0 && (
        <View className="flex-row items-center gap-1.5 mb-2">
          <AlertTriangle size={iconSize} color="#f59e0b" />
          <Text className={`${textSize} text-amber-700 dark:text-amber-400`}>
            {meta.obstacles.join(", ")}
          </Text>
        </View>
      )}

      {/* Landscaping-specific details */}
      {isLandscaping && hasLandscapingData && (
        <View className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-1">
          <View className="flex-row flex-wrap gap-x-6 gap-y-2 mb-2">
            {lawnAreaSqft && (
              <View className="flex-row items-center gap-1.5">
                <Trees size={iconSize} color="#22c55e" />
                <Text className={`${textSize} text-slate-700 dark:text-slate-300`}>
                  Lawn: {formatArea(lawnAreaSqft)}
                </Text>
              </View>
            )}
            {meta.irrigationType && meta.irrigationType !== "none" && (
              <View className="flex-row items-center gap-1.5">
                <Droplets size={iconSize} color="#3b82f6" />
                <Text className={`${textSize} text-slate-700 dark:text-slate-300`}>
                  {meta.irrigationType.charAt(0).toUpperCase() + meta.irrigationType.slice(1)}
                </Text>
              </View>
            )}
            {meta.slope && meta.slope !== "flat" && (
              <View className="flex-row items-center gap-1.5">
                <Triangle size={iconSize} color="#8b5cf6" />
                <Text className={`${textSize} text-slate-700 dark:text-slate-300`}>
                  {meta.slope.charAt(0).toUpperCase() + meta.slope.slice(1)} slope
                </Text>
              </View>
            )}
          </View>
          {meta.grassType && (
            <Text className={`${labelSize} text-slate-500 mb-1`}>
              Grass: {meta.grassType}
            </Text>
          )}
          {meta.serviceZones && meta.serviceZones.length > 0 && (
            <View className="mt-1">
              <Text className={`${labelSize} text-slate-500 mb-1`}>Zones:</Text>
              {meta.serviceZones.map((zone, i) => (
                <Text key={i} className={`${textSize} text-slate-600 dark:text-slate-400 ml-2`}>
                  {zone.name}{zone.areaSqft ? ` (${formatArea(zone.areaSqft)})` : ""}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </Card>
  );
}
