import { Badge } from "@/components/ui/Badge";
import { JOB_STATUS_COLORS } from "@/lib/colors";
import { JOB_STATUS_LABELS } from "@/lib/constants";
import type { JobStatus } from "@/types/models";

interface JobStatusBadgeProps {
  status: JobStatus;
  size?: "sm" | "md";
}

export function JobStatusBadge({ status, size = "sm" }: JobStatusBadgeProps) {
  const colors = JOB_STATUS_COLORS[status];
  return (
    <Badge
      label={JOB_STATUS_LABELS[status]}
      bgClass={colors.bg}
      textClass={colors.text}
      dotClass={colors.dot}
      showDot
      size={size}
    />
  );
}
