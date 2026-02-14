import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { getSchedule, getTechnicians } from "@/lib/services/jobs";
import { PageHeader } from "@/components/layout/page-header";
import { ScheduleView } from "./schedule-view";
import {
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  format,
  addDays,
} from "date-fns";

export const metadata: Metadata = { title: "Schedule" };

interface PageProps {
  searchParams: Promise<{
    view?: string;
    date?: string;
    tech?: string;
  }>;
}

export default async function SchedulePage({ searchParams }: PageProps) {
  const ctx = await requireAuth();
  const params = await searchParams;

  const view = params.view || "week";
  const baseDate = params.date ? new Date(params.date) : new Date();

  let from: Date;
  let to: Date;

  if (view === "day") {
    from = startOfDay(baseDate);
    to = endOfDay(baseDate);
  } else {
    from = startOfWeek(baseDate, { weekStartsOn: 1 });
    to = endOfWeek(baseDate, { weekStartsOn: 1 });
  }

  const [scheduleData, technicians] = await Promise.all([
    getSchedule(ctx, from.toISOString(), to.toISOString(), params.tech),
    getTechnicians(ctx),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        description={`${format(from, "MMM d")} – ${format(to, "MMM d, yyyy")}`}
      />

      <ScheduleView
        events={scheduleData}
        technicians={technicians}
        view={view}
        baseDate={baseDate.toISOString()}
        from={from.toISOString()}
        to={to.toISOString()}
      />
    </div>
  );
}
