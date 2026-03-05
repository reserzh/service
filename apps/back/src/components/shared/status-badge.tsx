import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = "job" | "estimate" | "invoice" | "agreement" | "priority" | "payment";

const statusStyles: Record<string, string> = {
  // Job statuses
  "job:new": "bg-status-new/10 text-status-new border-status-new/20",
  "job:scheduled": "bg-status-scheduled/10 text-status-scheduled border-status-scheduled/20",
  "job:dispatched": "bg-status-dispatched/10 text-status-dispatched border-status-dispatched/20",
  "job:en_route": "bg-status-en-route/10 text-status-en-route border-status-en-route/20",
  "job:in_progress": "bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20",
  "job:completed": "bg-status-completed/10 text-status-completed border-status-completed/20",
  "job:canceled": "bg-status-canceled/10 text-status-canceled border-status-canceled/20",

  // Estimate statuses
  "estimate:draft": "bg-status-draft/10 text-status-draft border-status-draft/20",
  "estimate:sent": "bg-status-sent/10 text-status-sent border-status-sent/20",
  "estimate:viewed": "bg-status-sent/10 text-status-sent border-status-sent/20",
  "estimate:approved": "bg-status-completed/10 text-status-completed border-status-completed/20",
  "estimate:declined": "bg-status-canceled/10 text-status-canceled border-status-canceled/20",
  "estimate:expired": "bg-status-canceled/10 text-status-canceled border-status-canceled/20",

  // Invoice statuses
  "invoice:draft": "bg-status-draft/10 text-status-draft border-status-draft/20",
  "invoice:sent": "bg-status-sent/10 text-status-sent border-status-sent/20",
  "invoice:viewed": "bg-status-sent/10 text-status-sent border-status-sent/20",
  "invoice:paid": "bg-status-paid/10 text-status-paid border-status-paid/20",
  "invoice:partial": "bg-status-partial/10 text-status-partial border-status-partial/20",
  "invoice:overdue": "bg-status-overdue/10 text-status-overdue border-status-overdue/20",
  "invoice:void": "bg-status-canceled/10 text-status-canceled border-status-canceled/20",

  // Agreement statuses
  "agreement:draft": "bg-status-draft/10 text-status-draft border-status-draft/20",
  "agreement:active": "bg-status-completed/10 text-status-completed border-status-completed/20",
  "agreement:paused": "bg-status-partial/10 text-status-partial border-status-partial/20",
  "agreement:completed": "bg-status-completed/10 text-status-completed border-status-completed/20",
  "agreement:canceled": "bg-status-canceled/10 text-status-canceled border-status-canceled/20",

  // Payment statuses
  "payment:pending": "bg-status-partial/10 text-status-partial border-status-partial/20",
  "payment:succeeded": "bg-status-paid/10 text-status-paid border-status-paid/20",
  "payment:failed": "bg-status-overdue/10 text-status-overdue border-status-overdue/20",
  "payment:refunded": "bg-status-canceled/10 text-status-canceled border-status-canceled/20",

  // Priorities
  "priority:low": "bg-muted text-muted-foreground border-muted",
  "priority:normal": "bg-status-new/10 text-status-new border-status-new/20",
  "priority:high": "bg-status-partial/10 text-status-partial border-status-partial/20",
  "priority:emergency": "bg-status-overdue/10 text-status-overdue border-status-overdue/20",
};

const statusLabels: Record<string, string> = {
  new: "New",
  scheduled: "Scheduled",
  dispatched: "Dispatched",
  en_route: "En Route",
  in_progress: "In Progress",
  completed: "Completed",
  canceled: "Canceled",
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  approved: "Approved",
  declined: "Declined",
  expired: "Expired",
  paid: "Paid",
  partial: "Partial",
  overdue: "Overdue",
  void: "Void",
  active: "Active",
  paused: "Paused",
  pending: "Pending",
  succeeded: "Succeeded",
  failed: "Failed",
  refunded: "Refunded",
  low: "Low",
  normal: "Normal",
  high: "High",
  emergency: "Emergency",
};

interface StatusBadgeProps {
  type: StatusType;
  status: string;
  className?: string;
}

export function StatusBadge({ type, status, className }: StatusBadgeProps) {
  const key = `${type}:${status}`;
  const style = statusStyles[key] ?? "bg-muted text-muted-foreground border-muted";
  const label = statusLabels[status] ?? status;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border text-[11px] px-2 py-0.5",
        style,
        className
      )}
    >
      {label}
    </Badge>
  );
}
