import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCustomerAuth } from "@/lib/portal-auth";
import { getPortalEstimate } from "@/lib/portal-queries";
import { ESTIMATE_STATUS_LABELS } from "@fieldservice/api-types/constants";
import { EstimateActions } from "./estimate-actions";

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

export default async function PortalEstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireCustomerAuth();
  const estimate = await getPortalEstimate(ctx, id);

  if (!estimate) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/portal/estimates"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        &larr; Back to Estimates
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Estimate {estimate.estimateNumber}
          </h1>
          <p className="mt-1 text-sm text-gray-700">{estimate.summary}</p>
          {estimate.validUntil && (
            <p className="mt-1 text-sm text-gray-500">
              Valid until {formatDate(estimate.validUntil)}
            </p>
          )}
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusColor(estimate.status)}`}
        >
          {ESTIMATE_STATUS_LABELS[estimate.status] ?? estimate.status}
        </span>
      </div>

      {/* Notes */}
      {estimate.notes && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-1">Notes</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{estimate.notes}</p>
        </div>
      )}

      {/* Options */}
      <div className="space-y-8 mb-8">
        {estimate.options.map((option) => (
          <div
            key={option.id}
            className="rounded-lg border border-gray-200 overflow-hidden"
          >
            <div className="flex items-center justify-between bg-gray-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {option.name}
                </h2>
                {option.isRecommended && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    Recommended
                  </span>
                )}
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(option.total)}
              </span>
            </div>

            {option.description && (
              <div className="px-6 py-3 border-b border-gray-200">
                <p className="text-sm text-gray-600">{option.description}</p>
              </div>
            )}

            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {option.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-right">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Approve / Decline Actions */}
      <EstimateActions
        estimateId={estimate.id}
        options={estimate.options.map((o) => ({
          id: o.id,
          name: o.name,
          isRecommended: o.isRecommended,
        }))}
        currentStatus={estimate.status}
      />
    </div>
  );
}
