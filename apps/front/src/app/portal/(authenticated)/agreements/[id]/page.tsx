import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCustomerAuth } from "@/lib/portal-auth";
import { getPortalAgreement } from "@/lib/portal-queries";
import {
  AGREEMENT_STATUS_LABELS,
  BILLING_FREQUENCY_LABELS,
  AGREEMENT_VISIT_STATUS_LABELS,
} from "@fieldservice/api-types/constants";
import type {
  AgreementStatus,
  BillingFrequency,
  AgreementVisitStatus,
} from "@fieldservice/api-types/enums";

function agreementStatusColor(status: AgreementStatus): string {
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

function visitStatusColor(status: AgreementVisitStatus): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "scheduled":
      return "bg-blue-100 text-blue-800";
    case "skipped":
      return "bg-yellow-100 text-yellow-800";
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

export default async function PortalAgreementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireCustomerAuth();
  const agreement = await getPortalAgreement(ctx, id);

  if (!agreement) {
    notFound();
  }

  const status = agreement.status as AgreementStatus;
  const billingFrequency = agreement.billingFrequency as BillingFrequency;

  return (
    <div>
      <Link
        href="/portal/agreements"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to Agreements
      </Link>

      {/* Header */}
      <div className="mt-4 rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">
              Agreement {agreement.agreementNumber}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">
              {agreement.name || "Untitled Agreement"}
            </h1>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${agreementStatusColor(status)}`}
          >
            {AGREEMENT_STATUS_LABELS[status] ?? status}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h2 className="text-sm font-medium text-gray-500">Start Date</h2>
            <p className="mt-1 text-gray-900">
              {formatDate(agreement.startDate)}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-gray-500">End Date</h2>
            <p className="mt-1 text-gray-900">
              {formatDate(agreement.endDate)}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-gray-500">
              Billing Frequency
            </h2>
            <p className="mt-1 text-gray-900">
              {BILLING_FREQUENCY_LABELS[billingFrequency] ?? billingFrequency}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-gray-500">Total Value</h2>
            <p className="mt-1 text-gray-900">
              {formatCurrency(agreement.totalValue)}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-gray-500">Auto-Renew</h2>
            <p className="mt-1 text-gray-900">
              {agreement.autoRenew ? "Yes" : "No"}
            </p>
          </div>
        </div>
      </div>

      {/* Services */}
      {agreement.services.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Services
          </h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Service Name
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
                {agreement.services.map((service) => (
                  <tr key={service.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {service.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-right">
                      {service.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-right">
                      {formatCurrency(service.unitPrice)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(String(parseFloat(service.quantity) * parseFloat(service.unitPrice)))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Visits */}
      {agreement.visits.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Visits</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Visit #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Scheduled Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Completed Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {agreement.visits.map((visit) => {
                  const vStatus = visit.status as AgreementVisitStatus;
                  return (
                    <tr key={visit.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {visit.visitNumber}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${visitStatusColor(vStatus)}`}
                        >
                          {AGREEMENT_VISIT_STATUS_LABELS[vStatus] ?? vStatus}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                        {formatDate(visit.scheduledDate)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                        {formatDate(visit.completedDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
