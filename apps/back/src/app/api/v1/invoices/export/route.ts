import { NextRequest } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { handleApiError } from "@/lib/api/errors";
import { listInvoices } from "@/lib/services/invoices";
import { toCSV, csvResponse, fetchAllPages } from "@/lib/csv";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    assertPermission(ctx, "reports", "read");
    const url = req.nextUrl;

    const rows = await fetchAllPages((page, pageSize) =>
      listInvoices(ctx, {
        page,
        pageSize,
        search: url.searchParams.get("search") || undefined,
        status: url.searchParams.get("status")
          ? (url.searchParams.get("status")!.split(",") as ("draft" | "sent" | "viewed" | "paid" | "partial" | "overdue" | "void")[])
          : undefined,
        from: url.searchParams.get("from") || undefined,
        to: url.searchParams.get("to") || undefined,
      })
    );

    const csv = toCSV(rows, [
      { key: "invoiceNumber", header: "Invoice #" },
      { key: "status", header: "Status" },
      { key: "customerFirstName", header: "Customer First" },
      { key: "customerLastName", header: "Customer Last" },
      { key: "subtotal", header: "Subtotal" },
      { key: "taxAmount", header: "Tax" },
      { key: "total", header: "Total" },
      { key: "amountPaid", header: "Paid" },
      { key: "balanceDue", header: "Balance Due" },
      { key: "dueDate", header: "Due Date" },
      { key: "sentAt", header: "Sent" },
      { key: "paidAt", header: "Paid Date" },
      { key: "createdAt", header: "Created" },
    ]);

    return csvResponse(csv, `invoices-${new Date().toISOString().slice(0, 10)}.csv`);
  } catch (error) {
    return handleApiError(error);
  }
}
