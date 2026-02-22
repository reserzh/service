import Link from "next/link";
import { requireCustomerAuth } from "@/lib/portal-auth";
import { getPortalEstimates } from "@/lib/portal-queries";
import { ESTIMATE_STATUS_LABELS } from "@fieldservice/api-types/constants";

function statusColor(status: string): string {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "sent":
    case "viewed":
      return "bg-blue-100 text-blue-800";
    case "declined":
      return "bg-red-100 text-red-800";
    case "expired":
    case "draft":
      return "bg-gray-100 text-gray-800";
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

export default async function PortalEstimatesPage() {
  const ctx = await requireCustomerAuth();
  const estimateList = await getPortalEstimates(ctx);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Estimates</h1>

      {estimateList.length === 0 ? (
        <p className="text-gray-500">No estimates found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Estimate Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Summary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Valid Until
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {estimateList.map((est) => (
                <tr key={est.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/portal/estimates/${est.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {est.estimateNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                    {est.summary}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(est.status)}`}
                    >
                      {ESTIMATE_STATUS_LABELS[est.status] ?? est.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                    {formatCurrency(est.totalAmount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {formatDate(est.validUntil)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
