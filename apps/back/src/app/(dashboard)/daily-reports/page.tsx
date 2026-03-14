"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Package,
  Wrench,
  MessageSquare,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

interface DailyReport {
  id: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  reportDate: string;
  materialRequests: string | null;
  equipmentIssues: string | null;
  officeNotes: string | null;
  createdAt: string;
}

export default function DailyReportsPage() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/daily-reports?date=${selectedDate}`);
        const data = await res.json();
        setReports(data.data ?? []);
      } catch {
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadReports();
  }, [selectedDate]);

  const materialReports = reports.filter((r) => r.materialRequests);
  const equipmentReports = reports.filter((r) => r.equipmentIssues);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Daily Reports"
        description="End-of-day reports from your crew"
      />

      <div className="flex items-center gap-3 mb-6">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p>No reports for this date</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Material Requests Summary */}
          {materialReports.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  Material Requests ({materialReports.length})
                </h3>
              </div>
              <div className="space-y-2">
                {materialReports.map((r) => (
                  <div key={r.id} className="flex gap-3">
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-200 min-w-[120px]">
                      {r.userFirstName} {r.userLastName}:
                    </span>
                    <span className="text-sm text-amber-700 dark:text-amber-300">
                      {r.materialRequests}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipment Issues Summary */}
          {equipmentReports.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  Equipment Issues ({equipmentReports.length})
                </h3>
              </div>
              <div className="space-y-2">
                {equipmentReports.map((r) => (
                  <div key={r.id} className="flex gap-3">
                    <span className="text-sm font-medium text-red-800 dark:text-red-200 min-w-[120px]">
                      {r.userFirstName} {r.userLastName}:
                    </span>
                    <span className="text-sm text-red-700 dark:text-red-300">
                      {r.equipmentIssues}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Reports */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              All Reports
            </h3>
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-lg border bg-card p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">
                    {report.userFirstName} {report.userLastName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(report.createdAt), "h:mm a")}
                  </span>
                </div>
                <div className="space-y-2">
                  {report.materialRequests && (
                    <div className="flex items-start gap-2">
                      <Package className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-sm">{report.materialRequests}</span>
                    </div>
                  )}
                  {report.equipmentIssues && (
                    <div className="flex items-start gap-2">
                      <Wrench className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <span className="text-sm">{report.equipmentIssues}</span>
                    </div>
                  )}
                  {report.officeNotes && (
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      <span className="text-sm">{report.officeNotes}</span>
                    </div>
                  )}
                  {!report.materialRequests && !report.equipmentIssues && !report.officeNotes && (
                    <span className="text-sm text-muted-foreground italic">No notes submitted</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
