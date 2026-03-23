"use client";

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "bg-status-new" },
  scheduled: { label: "Scheduled", color: "bg-status-scheduled" },
  dispatched: { label: "Dispatched", color: "bg-status-dispatched" },
  en_route: { label: "En Route", color: "bg-status-en-route" },
  in_progress: { label: "In Progress", color: "bg-status-in-progress" },
  completed: { label: "Completed", color: "bg-status-completed" },
  canceled: { label: "Canceled", color: "bg-status-canceled" },
};

const statusSteps = ["new", "scheduled", "dispatched", "en_route", "in_progress", "completed"];

interface JobStatusBarProps {
  status: string;
}

export function JobStatusBar({ status }: JobStatusBarProps) {
  const currentStepIdx = statusSteps.indexOf(status);

  if (status === "canceled") return null;

  return (
    <div className="flex items-center gap-1">
      {statusSteps.map((step, idx) => {
        const isComplete = idx < currentStepIdx;
        const isCurrent = idx === currentStepIdx;
        const stepSc = statusConfig[step];
        return (
          <div key={step} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`h-1.5 w-full rounded-full ${
                isComplete || isCurrent
                  ? stepSc.color
                  : "bg-muted"
              }`}
            />
            <span
              className={`text-[10px] ${
                isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              {stepSc.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
