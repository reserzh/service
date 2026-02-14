import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { getDispatchableJobs, getTechnicians, getSchedule } from "@/lib/services/jobs";
import { handleApiError } from "@/lib/api/errors";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);

    const today = new Date();
    const [unassignedJobs, technicians, todaysJobs] = await Promise.all([
      getDispatchableJobs(ctx),
      getTechnicians(ctx),
      getSchedule(ctx, startOfDay(today).toISOString(), endOfDay(today).toISOString()),
    ]);

    return NextResponse.json({
      data: {
        unassignedJobs,
        technicians,
        todaysJobs,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
