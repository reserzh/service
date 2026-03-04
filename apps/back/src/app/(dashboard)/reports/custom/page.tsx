import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { isAIConfigured } from "@/lib/ai/client";
import { listCustomReports } from "@/lib/services/custom-reports";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileBarChart, Plus } from "lucide-react";
import { CustomReportsActions } from "./custom-reports-actions";

export const metadata: Metadata = { title: "Custom Reports" };

export default async function CustomReportsPage() {
  const ctx = await requireAuth();

  if (!hasPermission(ctx.role, "reports", "read")) {
    redirect("/dashboard");
  }

  const aiConfigured = isAIConfigured() && hasPermission(ctx.role, "ai_assistant", "read");
  const { data: reports } = await listCustomReports(ctx, { page: 1, pageSize: 50 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Reports"
        description="AI-generated reports tailored to your needs"
      >
        {aiConfigured && <CustomReportsActions />}
      </PageHeader>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <FileBarChart className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <h3 className="text-sm font-medium">No custom reports yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {aiConfigured
              ? "Click \"New Custom Report\" to create your first AI-generated report."
              : "Custom reports require AI Assistant to be configured."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
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
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {report.description || "Custom AI-generated report"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Created{" "}
                    {new Date(report.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
