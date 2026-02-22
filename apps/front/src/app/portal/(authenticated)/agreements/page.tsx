import Link from "next/link";
import { requireCustomerAuth } from "@/lib/portal-auth";
import { getPortalAgreements } from "@/lib/portal-queries";
import { AGREEMENT_STATUS_LABELS } from "@fieldservice/api-types/constants";
import type { AgreementStatus } from "@fieldservice/api-types/enums";

function statusColor(status: AgreementStatus): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "draft":
      return "bg-gray-100 text-gray-700";
    case "paused":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
      return "bg-blue-100 text-blue-800";
    case "canceled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(value: string | null | undefined): string {
  const num = parseFloat(value ?? "0");
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

export default async function PortalAgreementsPage() {
  const ctx = await requireCustomerAuth();
  const agreementList = await getPortalAgreements(ctx);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Agreements</h1>

      {agreementList.length === 0 ? (
        <p className="mt-6 text-gray-500">No agreements found.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Agreement Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  End Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {agreementList.map((agreement) => {
                const status = agreement.status as AgreementStatus;
                return (
                  <tr
                    key={agreement.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <Link
                        href={`/portal/agreements/${agreement.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {agreement.agreementNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <Link
                        href={`/portal/agreements/${agreement.id}`}
                        className="hover:text-blue-600"
                      >
                        {agreement.name || "-"}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(status)}`}
                      >
                        {AGREEMENT_STATUS_LABELS[status] ?? status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {formatDate(agreement.startDate)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {formatDate(agreement.endDate)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(agreement.totalValue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
