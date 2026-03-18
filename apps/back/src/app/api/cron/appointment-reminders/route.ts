import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, customers, users, tenants } from "@fieldservice/shared/db/schema";
import { eq, and, between, isNull, inArray, sql } from "drizzle-orm";
import { verifyCronSecret, getSystemContext } from "../lib";
import { sendTriggeredCommunication } from "@/lib/services/communications";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  try {
    // Find all jobs scheduled ~24h from now that haven't been reminded
    const eligibleJobs = await db
      .select({
        jobId: jobs.id,
        tenantId: jobs.tenantId,
        jobNumber: jobs.jobNumber,
        summary: jobs.summary,
        scheduledStart: jobs.scheduledStart,
        customerEmail: customers.email,
        customerPhone: customers.phone,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
        techFirstName: users.firstName,
        techLastName: users.lastName,
        companyName: tenants.name,
      })
      .from(jobs)
      .innerJoin(customers, and(eq(jobs.customerId, customers.id), eq(jobs.tenantId, customers.tenantId)))
      .innerJoin(tenants, eq(jobs.tenantId, tenants.id))
      .leftJoin(users, and(eq(jobs.assignedTo, users.id), eq(jobs.tenantId, users.tenantId)))
      .where(
        and(
          between(jobs.scheduledStart, windowStart, windowEnd),
          inArray(jobs.status, ["scheduled", "dispatched"]),
          isNull(jobs.reminderSentAt)
        )
      );

    let processed = 0;
    let failed = 0;

    // Group by tenant to avoid repeated context lookups
    const byTenant = new Map<string, typeof eligibleJobs>();
    for (const job of eligibleJobs) {
      const list = byTenant.get(job.tenantId) ?? [];
      list.push(job);
      byTenant.set(job.tenantId, list);
    }

    for (const [tenantId, tenantJobs] of byTenant) {
      let ctx;
      try {
        ctx = await getSystemContext(tenantId);
      } catch {
        failed += tenantJobs.length;
        continue;
      }

      for (const job of tenantJobs) {
        if (!job.customerEmail) {
          failed++;
          continue;
        }

        try {
          const scheduledDate = job.scheduledStart
            ? format(new Date(job.scheduledStart), "MMMM d, yyyy")
            : "TBD";
          const scheduledTime = job.scheduledStart
            ? format(new Date(job.scheduledStart), "h:mm a")
            : "TBD";
          const techName = job.techFirstName
            ? `${job.techFirstName} ${job.techLastName}`
            : "Your technician";

          await sendTriggeredCommunication(ctx, "appointment_reminder", {
            recipientEmail: job.customerEmail,
            recipientPhone: job.customerPhone ?? undefined,
            recipientName: `${job.customerFirstName} ${job.customerLastName}`,
            entityType: "job",
            entityId: job.jobId,
            variables: {
              customerFirstName: job.customerFirstName,
              customerLastName: job.customerLastName,
              jobNumber: job.jobNumber,
              jobSummary: job.summary,
              scheduledDate,
              scheduledTime,
              technicianName: techName,
              companyName: job.companyName,
            },
          });

          await db
            .update(jobs)
            .set({ reminderSentAt: new Date() })
            .where(eq(jobs.id, job.jobId));

          processed++;
        } catch (error) {
          console.error(`[Cron] Reminder failed for job ${job.jobNumber}:`, error);
          failed++;
        }
      }
    }

    return NextResponse.json({ processed, failed, total: eligibleJobs.length });
  } catch (error) {
    console.error("[Cron] Appointment reminders error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
