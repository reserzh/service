import { Badge } from "@/components/ui/Badge";
import { INVOICE_STATUS_COLORS } from "@/lib/colors";
import { INVOICE_STATUS_LABELS } from "@/lib/constants";
import type { InvoiceStatus } from "@/types/models";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  size?: "sm" | "md";
}

export function InvoiceStatusBadge({ status, size = "sm" }: InvoiceStatusBadgeProps) {
  const colors = INVOICE_STATUS_COLORS[status];
  return (
    <Badge
      label={INVOICE_STATUS_LABELS[status]}
      bgClass={colors.bg}
      textClass={colors.text}
      size={size}
    />
  );
}
