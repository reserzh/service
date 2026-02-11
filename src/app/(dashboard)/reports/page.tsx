import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Briefcase, Receipt, Users } from "lucide-react";
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
  await requireAuth();

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
    </div>
  );
}
