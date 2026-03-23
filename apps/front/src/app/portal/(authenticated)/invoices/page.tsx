import Link from "next/link";
import { AlertTriangle, Receipt } from "lucide-react";
import { requireCustomerAuth } from "@/lib/portal-auth";
import { getPortalInvoices } from "@/lib/portal-queries";
import { INVOICE_STATUS_LABELS } from "@fieldservice/api-types/constants";
import { EmptyState } from "@/components/portal/empty-state";

function statusColor(status: string): string {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800";
    case "sent":
    case "viewed":
      return "bg-blue-100 text-blue-800";
    case "overdue":
      return "bg-red-100 text-red-800";
    case "partial":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function formatCurrency(value: string | null | undefined): string {
  const num = parseFloat(value ?? "0");
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
}

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function PortalInvoicesPage() {
  const ctx = await requireCustomerAuth();
  const invoiceList = await getPortalInvoices(ctx);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Invoices</h1>

      {invoiceList.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Your invoices will appear here once they are created."
        />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {invoiceList.map((inv) => (
              <Link
                key={inv.id}
                href={`/portal/invoices/${inv.id}`}
                className={`block rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow ${inv.status === "overdue" ? "border-red-200 bg-red-50" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-600">{inv.invoiceNumber}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(inv.status)}`}
                  >
                    {INVOICE_STATUS_LABELS[inv.status] ?? inv.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Due {formatDate(inv.dueDate)}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total: {formatCurrency(inv.total)}</span>
                  <span className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1">
                    {inv.status === "overdue" && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    {formatCurrency(inv.balanceDue)}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Invoice Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Balance Due
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {invoiceList.map((inv) => (
                  <tr key={inv.id} className={`hover:bg-gray-50 transition-colors ${inv.status === "overdue" ? "bg-red-50" : ""}`}>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/portal/invoices/${inv.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(inv.status)}`}
                      >
                        {INVOICE_STATUS_LABELS[inv.status] ?? inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                      <span className="inline-flex items-center gap-1">
                        {inv.status === "overdue" && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        {formatCurrency(inv.balanceDue)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
