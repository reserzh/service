"use client";

import { FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TableData {
  title: string;
  columns: string[];
  rows: string[][];
}

interface ReportDownloadProps {
  data: TableData;
}

export function ReportDownload({ data }: ReportDownloadProps) {
  if (!data || !data.columns || !data.rows) return null;

  const handlePdf = async () => {
    const { exportTableToPdf } = await import(
      "@/app/(dashboard)/ai-assistant/export-pdf"
    );
    exportTableToPdf(data.title, data.columns, data.rows);
  };

  const handleExcel = async () => {
    const { exportTableToExcel } = await import(
      "@/app/(dashboard)/ai-assistant/export-excel"
    );
    exportTableToExcel(data.title, data.columns, data.rows);
  };

  return (
    <div className="rounded-xl border bg-card">
      {/* Table preview */}
      <div className="overflow-x-auto p-4">
        {data.title && (
          <h4 className="mb-3 text-sm font-medium">{data.title}</h4>
        )}
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              {data.columns.map((col, i) => (
                <th key={i} className="px-3 py-2 text-left font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.slice(0, 10).map((row, ri) => (
              <tr key={ri} className="border-b last:border-0">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-1.5">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.rows.length > 10 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Showing 10 of {data.rows.length} rows. Download for full data.
          </p>
        )}
      </div>

      {/* Download buttons */}
      <div className="flex gap-2 border-t px-4 py-3">
        <Button variant="outline" size="sm" onClick={handlePdf}>
          <FileDown className="mr-2 h-3.5 w-3.5" />
          Download PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleExcel}>
          <FileSpreadsheet className="mr-2 h-3.5 w-3.5" />
          Download Excel
        </Button>
      </div>
    </div>
  );
}
