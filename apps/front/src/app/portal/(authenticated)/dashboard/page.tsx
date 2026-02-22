import { requireCustomerAuth } from "@/lib/portal-auth";
import { getPortalDashboard } from "@/lib/portal-queries";

export default async function PortalDashboardPage() {
  const ctx = await requireCustomerAuth();
  const dashboard = await getPortalDashboard(ctx);

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(amount));
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">
        Welcome, {ctx.firstName}
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-3xl font-bold text-gray-900">
            {dashboard.jobCount}
          </p>
          <p className="mt-1 text-sm text-gray-500">Total Jobs</p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-3xl font-bold text-gray-900">
            {dashboard.openInvoices.count}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Open Invoices{" "}
            {dashboard.openInvoices.count > 0 && (
              <span className="text-gray-700">
                ({formatCurrency(dashboard.openInvoices.total)})
              </span>
            )}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-3xl font-bold text-gray-900">
            {dashboard.pendingEstimates}
          </p>
          <p className="mt-1 text-sm text-gray-500">Pending Estimates</p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-3xl font-bold text-gray-900">
            {dashboard.activeAgreements}
          </p>
          <p className="mt-1 text-sm text-gray-500">Active Agreements</p>
        </div>
      </div>
    </div>
  );
}
