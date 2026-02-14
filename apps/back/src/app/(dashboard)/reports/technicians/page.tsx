import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { getTechnicianReport } from "@/lib/services/reports";
import { PageHeader } from "@/components/layout/page-header";
import { subDays, format } from "date-fns";
import { TechnicianReportView } from "./technician-report-view";

export const metadata: Metadata = { title: "Technician Performance Report" };

interface PageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
}

export default async function TechnicianReportPage({ searchParams }: PageProps) {
  const ctx = await requireAuth();
  const params = await searchParams;

  const from = params.from || format(subDays(new Date(), 30), "yyyy-MM-dd");
  const to = params.to || format(new Date(), "yyyy-MM-dd");

  const data = await getTechnicianReport(ctx, {
    from: `${from}T00:00:00Z`,
    to: `${to}T23:59:59Z`,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Technician Performance"
        description="Individual technician metrics and productivity"
        breadcrumbs={[
          { label: "Reports", href: "/reports" },
          { label: "Technicians" },
        ]}
      />
      <TechnicianReportView data={data} from={from} to={to} />
    </div>
  );
}
