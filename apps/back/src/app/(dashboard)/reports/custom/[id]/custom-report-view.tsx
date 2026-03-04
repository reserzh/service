"use client";

import { useState, useTransition } from "react";
import { RefreshCw, MessageSquare, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { ChartRenderer } from "@/components/ai/chart-renderer";
import { ReportDownload } from "@/components/ai/report-download";
import { ChatPanel } from "@/components/ai/chat-panel";
import type { ChartData } from "@/components/ai/chart-renderer";
import type { TableData } from "@/components/ai/report-download";
import type { QueryDefinition } from "@/components/ai/chat-panel";
import { deleteCustomReportAction, updateCustomReportAction } from "@/actions/custom-reports";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ReportData {
  id: string;
  title: string;
  description: string | null;
  reportConfig: {
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
  };
  conversationId: string | null;
  lastRefreshedAt: string | null;
  createdAt: string;
}

interface CustomReportViewProps {
  report: ReportData;
  aiConfigured: boolean;
}

export function CustomReportView({ report, aiConfigured }: CustomReportViewProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!confirm("Delete this custom report?")) return;
    startDeleteTransition(async () => {
      await deleteCustomReportAction(report.id);
      router.push("/reports/custom");
    });
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleChartGenerated = (chart: ChartData, queryDef: QueryDefinition) => {
    updateCustomReportAction(report.id, {
      reportConfig: {
        charts: [
          {
            type: chart.type,
            title: chart.title,
            xKey: chart.xKey,
            yKey: chart.yKey,
            nameKey: chart.nameKey,
            valueKey: chart.valueKey,
            data: chart.data,
          },
          ...report.reportConfig.charts.slice(1),
        ],
        tables: report.reportConfig.tables,
      },
    });
    setChatOpen(false);
    window.location.reload();
  };

  const handleTableGenerated = (table: TableData, _queryDef: QueryDefinition) => {
    updateCustomReportAction(report.id, {
      reportConfig: {
        charts: report.reportConfig.charts,
        tables: [
          {
            title: table.title,
            columns: table.columns,
            rows: table.rows,
          },
          ...report.reportConfig.tables.slice(1),
        ],
      },
    });
    setChatOpen(false);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/reports" className="hover:text-foreground">
          Reports
        </Link>
        <span>/</span>
        <Link href="/reports/custom" className="hover:text-foreground">
          Custom
        </Link>
        <span>/</span>
        <span className="text-foreground">{report.title}</span>
      </div>

      <PageHeader
        title={report.title}
        description={report.description ?? undefined}
      >
        <div className="flex items-center gap-2">
          {aiConfigured && (
            <Button variant="outline" size="sm" onClick={() => setChatOpen(true)}>
              <MessageSquare className="mr-2 h-3.5 w-3.5" />
              Refine with AI
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-3.5 w-3.5" />
            )}
            Delete
          </Button>
        </div>
      </PageHeader>

      {/* Charts */}
      {report.reportConfig.charts.map((chart, i) => (
        <ChartRenderer
          key={`chart-${i}`}
          data={{
            type: chart.type,
            title: chart.title,
            xKey: chart.xKey,
            yKey: chart.yKey,
            nameKey: chart.nameKey,
            valueKey: chart.valueKey,
            data: chart.data,
          }}
          height={300}
        />
      ))}

      {/* Tables */}
      {report.reportConfig.tables.map((table, i) => (
        <ReportDownload
          key={`table-${i}`}
          data={{
            title: table.title,
            columns: table.columns,
            rows: table.rows,
          }}
        />
      ))}

      {report.reportConfig.charts.length === 0 &&
        report.reportConfig.tables.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">
              This report has no visualizations yet. Click &quot;Refine with AI&quot; to add charts or tables.
            </p>
          </div>
        )}

      {report.lastRefreshedAt && (
        <p className="text-xs text-muted-foreground">
          Last refreshed:{" "}
          {new Date(report.lastRefreshedAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      )}

      {/* AI Chat Panel */}
      {aiConfigured && (
        <ChatPanel
          open={chatOpen}
          onOpenChange={setChatOpen}
          initialConversationId={report.conversationId}
          onChartGenerated={handleChartGenerated}
          onTableGenerated={handleTableGenerated}
          actionLabel="Save as Report"
        />
      )}
    </div>
  );
}
