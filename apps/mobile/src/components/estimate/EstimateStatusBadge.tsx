import { Badge } from "@/components/ui/Badge";
import { ESTIMATE_STATUS_COLORS } from "@/lib/colors";
import { ESTIMATE_STATUS_LABELS } from "@/lib/constants";
import type { EstimateStatus } from "@/types/models";

interface EstimateStatusBadgeProps {
  status: EstimateStatus;
  size?: "sm" | "md";
}

export function EstimateStatusBadge({ status, size = "sm" }: EstimateStatusBadgeProps) {
  const colors = ESTIMATE_STATUS_COLORS[status];
  return (
    <Badge
      label={ESTIMATE_STATUS_LABELS[status]}
      bgClass={colors.bg}
      textClass={colors.text}
      size={size}
    />
  );
}
