"use client";

import { useState, useCallback, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/ai/chat-panel";
import type { ChartData } from "@/components/ai/chart-renderer";
import type { TableData } from "@/components/ai/report-download";
import type { QueryDefinition } from "@/components/ai/chat-panel";
import { saveCustomReportAction } from "@/actions/custom-reports";
import { useRouter } from "next/navigation";

export function CustomReportsActions() {
  const [chatOpen, setChatOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const handleChartGenerated = useCallback(
    (chart: ChartData, queryDef: QueryDefinition) => {
      startTransition(async () => {
        const result = await saveCustomReportAction({
          title: chart.title || "Custom Report",
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
            ],
            tables: [],
          },
          queryDefinition: queryDef,
          cachedData: { charts: [{ data: chart.data }] } as Record<string, unknown>,
        });
        if (result.success && result.reportId) {
          setChatOpen(false);
          router.push(`/reports/custom/${result.reportId}`);
        }
      });
    },
    [router]
  );

  const handleTableGenerated = useCallback(
    (table: TableData, queryDef: QueryDefinition) => {
      startTransition(async () => {
        const result = await saveCustomReportAction({
          title: table.title || "Custom Report",
          reportConfig: {
            charts: [],
            tables: [
              {
                title: table.title,
                columns: table.columns,
                rows: table.rows,
              },
            ],
          },
          queryDefinition: queryDef,
          cachedData: { tables: [{ columns: table.columns, rows: table.rows }] } as Record<string, unknown>,
        });
        if (result.success && result.reportId) {
          setChatOpen(false);
          router.push(`/reports/custom/${result.reportId}`);
        }
      });
    },
    [router]
  );

  return (
    <>
      <Button size="sm" onClick={() => setChatOpen(true)}>
        <Plus className="mr-2 h-3.5 w-3.5" />
        New Custom Report
      </Button>
      <ChatPanel
        open={chatOpen}
        onOpenChange={setChatOpen}
        onChartGenerated={handleChartGenerated}
        onTableGenerated={handleTableGenerated}
        actionLabel="Save as Report"
      />
    </>
  );
}
