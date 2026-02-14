import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { getJobsReport } from "@/lib/services/reports";
import { PageHeader } from "@/components/layout/page-header";
import { subDays, format } from "date-fns";
import { JobsReportView } from "./jobs-report-view";

export const metadata: Metadata = { title: "Jobs Report" };

interface PageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
}

export default async function JobsReportPage({ searchParams }: PageProps) {
  const ctx = await requireAuth();
  const params = await searchParams;

  const from = params.from || format(subDays(new Date(), 30), "yyyy-MM-dd");
  const to = params.to || format(new Date(), "yyyy-MM-dd");

  const data = await getJobsReport(ctx, {
    from: `${from}T00:00:00Z`,
    to: `${to}T23:59:59Z`,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs Report"
        description="Job completion and performance metrics"
        breadcrumbs={[
          { label: "Reports", href: "/reports" },
          { label: "Jobs" },
        ]}
      />
      <JobsReportView data={data} from={from} to={to} />
    </div>
  );
}
