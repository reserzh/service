import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCustomerAuth } from "@/lib/portal-auth";
import { getPortalInvoice } from "@/lib/portal-queries";
import { INVOICE_STATUS_LABELS } from "@fieldservice/api-types/constants";

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

function formatPaymentMethod(method: string): string {
  const labels: Record<string, string> = {
    credit_card: "Credit Card",
    debit_card: "Debit Card",
    ach: "ACH",
    cash: "Cash",
    check: "Check",
    other: "Other",
  };
  return labels[method] ?? method;
}

export default async function PortalInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireCustomerAuth();
  const invoice = await getPortalInvoice(ctx, id);

  if (!invoice) {
    notFound();
  }

  const showPayButton =
    parseFloat(invoice.balanceDue) > 0 &&
    invoice.status !== "paid" &&
    invoice.status !== "void";

  return (
    <div>
      <Link
        href="/portal/invoices"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        &larr; Back to Invoices
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Invoice {invoice.invoiceNumber}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Due {formatDate(invoice.dueDate)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusColor(invoice.status)}`}
          >
            {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
          </span>
          {showPayButton && (
            <a
              href={`/api/portal/invoices/${invoice.id}/checkout`}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Pay Now
            </a>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
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
            {invoice.lineItems.map((item) => (
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

      {/* Summary */}
      <div className="flex justify-end mb-8">
        <div className="w-72 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax</span>
            <span>{formatCurrency(invoice.taxAmount)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-sm font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Amount Paid</span>
            <span>{formatCurrency(invoice.amountPaid)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900">
            <span>Balance Due</span>
            <span>{formatCurrency(invoice.balanceDue)}</span>
          </div>
        </div>
      </div>

      {/* Payment History */}
      {invoice.payments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Payment History
          </h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {invoice.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(payment.processedAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatPaymentMethod(payment.method)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {payment.referenceNumber || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
