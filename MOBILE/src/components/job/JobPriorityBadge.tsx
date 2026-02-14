import { Badge } from "@/components/ui/Badge";
import { JOB_PRIORITY_COLORS } from "@/lib/colors";
import { JOB_PRIORITY_LABELS } from "@/lib/constants";
import type { JobPriority } from "@/types/models";

interface JobPriorityBadgeProps {
  priority: JobPriority;
}

export function JobPriorityBadge({ priority }: JobPriorityBadgeProps) {
  if (priority === "normal") return null;
  const colors = JOB_PRIORITY_COLORS[priority];
  return (
    <Badge
      label={JOB_PRIORITY_LABELS[priority]}
      bgClass={colors.bg}
      textClass={colors.text}
    />
  );
}
