import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import {
  getDispatchableJobs,
  getTechnicians,
  getSchedule,
} from "@/lib/services/jobs";
import { PageHeader } from "@/components/layout/page-header";
import { DispatchBoard } from "./dispatch-board";
import { startOfDay, endOfDay } from "date-fns";

export const metadata: Metadata = { title: "Dispatch" };

export default async function DispatchPage() {
  const ctx = await requireAuth();

  const today = new Date();
  const [unassignedJobs, technicians, todaysJobs] = await Promise.all([
    getDispatchableJobs(ctx),
    getTechnicians(ctx),
    getSchedule(ctx, startOfDay(today).toISOString(), endOfDay(today).toISOString()),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispatch Board"
        description="Assign and track technicians in real time"
      />

      <DispatchBoard
        unassignedJobs={unassignedJobs}
        technicians={technicians}
        todaysJobs={todaysJobs}
      />
    </div>
  );
}
