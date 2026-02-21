import { NextRequest } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { handleApiError } from "@/lib/api/errors";
import { listCustomers } from "@/lib/services/customers";
import { toCSV, csvResponse, fetchAllPages } from "@/lib/csv";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    assertPermission(ctx, "reports", "read");
    const url = req.nextUrl;

    const rows = await fetchAllPages((page, pageSize) =>
      listCustomers(ctx, {
        page,
        pageSize,
        search: url.searchParams.get("search") || undefined,
        type: (url.searchParams.get("type") as "residential" | "commercial") || undefined,
      })
    );

    const csv = toCSV(rows, [
      { key: "firstName", header: "First Name" },
      { key: "lastName", header: "Last Name" },
      { key: "email", header: "Email" },
      { key: "phone", header: "Phone" },
      { key: "altPhone", header: "Alt Phone" },
      { key: "companyName", header: "Company" },
      { key: "type", header: "Type" },
      { key: "source", header: "Source" },
      { key: "createdAt", header: "Created" },
    ]);

    return csvResponse(csv, `customers-${new Date().toISOString().slice(0, 10)}.csv`);
  } catch (error) {
    return handleApiError(error);
  }
}
