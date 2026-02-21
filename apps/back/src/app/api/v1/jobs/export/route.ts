import { NextRequest } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { handleApiError } from "@/lib/api/errors";
import { listJobs } from "@/lib/services/jobs";
import { toCSV, csvResponse, fetchAllPages } from "@/lib/csv";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    assertPermission(ctx, "reports", "read");
    const url = req.nextUrl;

    const statusParam = url.searchParams.get("status");
    const rows = await fetchAllPages((page, pageSize) =>
      listJobs(ctx, {
        page,
        pageSize,
        search: url.searchParams.get("search") || undefined,
        status: statusParam
          ? (statusParam.split(",") as ("new" | "scheduled" | "dispatched" | "in_progress" | "completed" | "canceled")[])
          : undefined,
        priority: (url.searchParams.get("priority") as "low" | "normal" | "high" | "emergency") || undefined,
        from: url.searchParams.get("from") || undefined,
        to: url.searchParams.get("to") || undefined,
      })
    );

    const csv = toCSV(rows, [
      { key: "jobNumber", header: "Job #" },
      { key: "summary", header: "Summary" },
      { key: "status", header: "Status" },
      { key: "priority", header: "Priority" },
      { key: "jobType", header: "Type" },
      { key: "customerFirstName", header: "Customer First" },
      { key: "customerLastName", header: "Customer Last" },
      { key: "propertyCity", header: "City" },
      { key: "propertyState", header: "State" },
      { key: "assignedFirstName", header: "Assigned To" },
      { key: "scheduledStart", header: "Scheduled Start" },
      { key: "totalAmount", header: "Amount" },
      { key: "createdAt", header: "Created" },
    ]);

    return csvResponse(csv, `jobs-${new Date().toISOString().slice(0, 10)}.csv`);
  } catch (error) {
    return handleApiError(error);
  }
}
