import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { isAIConfigured } from "@/lib/ai/client";
import { listCustomReports } from "@/lib/services/custom-reports";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Briefcase, Receipt, Users, FileBarChart, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Reports" };

const reports = [
  {
    title: "Revenue",
    description: "Track revenue by day, week, month, or custom range",
    icon: DollarSign,
    href: "/reports/revenue",
  },
  {
    title: "Jobs",
    description: "Job completion metrics, status breakdown, and trends",
    icon: Briefcase,
    href: "/reports/jobs",
  },
  {
    title: "Invoices & AR",
    description: "Outstanding invoices, AR aging, and payment tracking",
    icon: Receipt,
    href: "/reports/invoices",
  },
  {
    title: "Technicians",
    description: "Productivity, jobs completed, and revenue per tech",
    icon: Users,
    href: "/reports/technicians",
  },
];

export default async function ReportsPage() {
  const ctx = await requireAuth();

  const aiConfigured =
    isAIConfigured() &&
    hasPermission(ctx.role, "ai_assistant", "read") &&
    hasPermission(ctx.role, "reports", "read");

  let customReports: Array<{
    id: string;
    title: string;
    description: string | null;
    createdAt: Date;
  }> = [];

  if (aiConfigured) {
    const { data } = await listCustomReports(ctx, { page: 1, pageSize: 4 });
    customReports = data;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Insights into your business performance" />

      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((report) => (
          <Link key={report.href} href={report.href}>
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                <div className="rounded-md bg-muted p-2">
                  <report.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-base">{report.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Custom Reports Section */}
      {aiConfigured && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Custom Reports</h2>
            <Link
              href="/reports/custom"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {customReports.length === 0 ? (
            <Link href="/reports/custom">
              <Card className="cursor-pointer border-dashed transition-colors hover:border-primary/50">
                <CardContent className="flex items-center gap-3 py-6">
                  <div className="rounded-md bg-muted p-2">
                    <FileBarChart className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Create Custom Report</p>
                    <p className="text-sm text-muted-foreground">
                      Use AI to generate custom charts and reports
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {customReports.map((report) => (
                <Link key={report.id} href={`/reports/custom/${report.id}`}>
                  <Card className="h-full cursor-pointer transition-colors hover:border-primary/50">
                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                      <div className="rounded-md bg-muted p-2">
                        <FileBarChart className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <CardTitle className="line-clamp-1 text-base">
                        {report.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-1 text-sm text-muted-foreground">
                        {report.description || "Custom AI-generated report"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
