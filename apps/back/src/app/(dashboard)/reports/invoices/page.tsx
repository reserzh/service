import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { getInvoiceReport } from "@/lib/services/reports";
import { PageHeader } from "@/components/layout/page-header";
import { subDays, format } from "date-fns";
import { InvoiceReportView } from "./invoice-report-view";

export const metadata: Metadata = { title: "Invoices & AR Report" };

interface PageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
}

export default async function InvoiceReportPage({ searchParams }: PageProps) {
  const ctx = await requireAuth();
  const params = await searchParams;

  const from = params.from || format(subDays(new Date(), 90), "yyyy-MM-dd");
  const to = params.to || format(new Date(), "yyyy-MM-dd");

  const data = await getInvoiceReport(ctx, {
    from: `${from}T00:00:00Z`,
    to: `${to}T23:59:59Z`,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices & AR Report"
        description="Accounts receivable and payment tracking"
        breadcrumbs={[
          { label: "Reports", href: "/reports" },
          { label: "Invoices & AR" },
        ]}
      />
      <InvoiceReportView data={data} from={from} to={to} />
    </div>
  );
}
