import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { isAIConfigured } from "@/lib/ai/client";
import { getCustomReport } from "@/lib/services/custom-reports";
import { redirect, notFound } from "next/navigation";
import { CustomReportView } from "./custom-report-view";

export const metadata: Metadata = { title: "Custom Report" };

export default async function CustomReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAuth();

  if (!hasPermission(ctx.role, "reports", "read")) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const report = await getCustomReport(ctx, id);
  if (!report) notFound();

  const aiConfigured = isAIConfigured() && hasPermission(ctx.role, "ai_assistant", "read");

  return (
    <CustomReportView
      report={{
        id: report.id,
        title: report.title,
        description: report.description,
        reportConfig: report.reportConfig as {
          charts: Array<{
            type: "bar" | "line" | "area" | "pie";
            title: string;
            xKey?: string;
            yKey?: string;
            nameKey?: string;
            valueKey?: string;
            data: Record<string, unknown>[];
          }>;
          tables: Array<{
            title: string;
            columns: string[];
            rows: string[][];
          }>;
        },
        conversationId: report.conversationId,
        lastRefreshedAt: report.lastRefreshedAt?.toISOString() ?? null,
        createdAt: report.createdAt.toISOString(),
      }}
      aiConfigured={aiConfigured}
    />
  );
}
