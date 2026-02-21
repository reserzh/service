import { NextRequest } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { handleApiError } from "@/lib/api/errors";
import { listEstimates } from "@/lib/services/estimates";
import { toCSV, csvResponse, fetchAllPages } from "@/lib/csv";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    assertPermission(ctx, "reports", "read");
    const url = req.nextUrl;

    const rows = await fetchAllPages((page, pageSize) =>
      listEstimates(ctx, {
        page,
        pageSize,
        search: url.searchParams.get("search") || undefined,
        status: url.searchParams.get("status")
          ? (url.searchParams.get("status")!.split(",") as ("draft" | "sent" | "viewed" | "approved" | "declined" | "expired")[])
          : undefined,
      })
    );

    const csv = toCSV(rows, [
      { key: "estimateNumber", header: "Estimate #" },
      { key: "status", header: "Status" },
      { key: "customerFirstName", header: "Customer First" },
      { key: "customerLastName", header: "Customer Last" },
      { key: "summary", header: "Summary" },
      { key: "totalAmount", header: "Total" },
      { key: "validUntil", header: "Valid Until" },
      { key: "sentAt", header: "Sent" },
      { key: "approvedAt", header: "Approved" },
      { key: "createdAt", header: "Created" },
    ]);

    return csvResponse(csv, `estimates-${new Date().toISOString().slice(0, 10)}.csv`);
  } catch (error) {
    return handleApiError(error);
  }
}
