import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { getRevenueReport } from "@/lib/services/reports";
import { PageHeader } from "@/components/layout/page-header";
import { subDays, format } from "date-fns";
import { RevenueReportView } from "./revenue-report-view";

export const metadata: Metadata = { title: "Revenue Report" };

interface PageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    groupBy?: string;
  }>;
}

export default async function RevenueReportPage({ searchParams }: PageProps) {
  const ctx = await requireAuth();
  const params = await searchParams;

  const from = params.from || format(subDays(new Date(), 30), "yyyy-MM-dd");
  const to = params.to || format(new Date(), "yyyy-MM-dd");
  const groupBy = (params.groupBy as "day" | "week" | "month") || "day";

  const data = await getRevenueReport(ctx, {
    from: `${from}T00:00:00Z`,
    to: `${to}T23:59:59Z`,
    groupBy,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue Report"
        description="Payment collection and trends"
        breadcrumbs={[
          { label: "Reports", href: "/reports" },
          { label: "Revenue" },
        ]}
      />
      <RevenueReportView data={data} from={from} to={to} groupBy={groupBy} />
    </div>
  );
}
