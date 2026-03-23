"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Wrench } from "lucide-react";
import { useCallback } from "react";
import { ListPagination } from "@/components/shared/list-pagination";
import { ListToolbar, type FilterConfig } from "@/components/shared/list-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { format } from "date-fns";

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "text-muted-foreground" },
  normal: { label: "Normal", className: "text-foreground" },
  high: { label: "High", className: "text-amber-600 font-medium" },
  emergency: { label: "Emergency", className: "text-destructive font-bold" },
};

interface Job {
  id: string;
  jobNumber: string;
  summary: string;
  status: string;
  priority: string;
  jobType: string;
  serviceType: string | null;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  totalAmount: string | null;
  createdAt: Date;
  customerId: string;
  customerFirstName: string | null;
  customerLastName: string | null;
  propertyCity: string | null;
  propertyState: string | null;
  assignedTo: string | null;
  assignedFirstName: string | null;
  assignedLastName: string | null;
  assignedColor: string | null;
}

interface JobListProps {
  jobs: Job[];
  meta: { page: number; pageSize: number; total: number };
  searchQuery?: string;
  statusFilter?: string;
  priorityFilter?: string;
  dateFrom?: string;
  dateTo?: string;
}

const jobFilters: FilterConfig[] = [
  {
    key: "status",
    label: "Status",
    multi: true,
    options: [
      { value: "new", label: "New" },
      { value: "scheduled", label: "Scheduled" },
      { value: "dispatched", label: "Dispatched" },
      { value: "en_route", label: "En Route" },
      { value: "in_progress", label: "In Progress" },
      { value: "completed", label: "Completed" },
      { value: "canceled", label: "Canceled" },
    ],
  },
  {
    key: "priority",
    label: "Priority",
    options: [
      { value: "low", label: "Low" },
      { value: "normal", label: "Normal" },
      { value: "high", label: "High" },
      { value: "emergency", label: "Emergency" },
    ],
  },
];

export function JobList({ jobs, meta, searchQuery, statusFilter, priorityFilter, dateFrom, dateTo }: JobListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      router.push(`/jobs?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <ListToolbar
        basePath="/jobs"
        searchPlaceholder="Search jobs..."
        searchQuery={searchQuery}
        filters={jobFilters}
        activeFilters={{
          status: statusFilter ?? "",
          priority: priorityFilter ?? "",
        }}
        showDateRange
        dateFrom={dateFrom}
        dateTo={dateTo}
        exportUrl="/api/v1/jobs/export"
      />

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden lg:table-cell">Scheduled</TableHead>
              <TableHead className="hidden md:table-cell">Assigned</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  {searchQuery || statusFilter ? (
                    <p className="text-center py-8 text-muted-foreground">No jobs match your filters.</p>
                  ) : (
                    <EmptyState
                      icon={Wrench}
                      title="No jobs yet"
                      description="Create your first service job to start tracking work, scheduling technicians, and billing customers."
                      actionLabel="Create Job"
                      actionHref="/jobs/new"
                    />
                  )}
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => {
                return (
                  <TableRow key={job.id} className="group">
                    <TableCell>
                      <Link href={`/jobs/${job.id}`} className="block">
                        <span className="text-xs text-muted-foreground">{job.jobNumber}</span>
                        <p className="font-medium group-hover:text-primary leading-tight transition-colors">{job.summary}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{job.jobType}</span>
                          {job.priority !== "normal" && (
                            <StatusBadge type="priority" status={job.priority} className="text-[10px] px-1.5 py-0" />
                          )}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {job.customerFirstName ? (
                        <div>
                          <p className="text-sm">{job.customerFirstName} {job.customerLastName}</p>
                          {job.propertyCity && (
                            <p className="text-xs text-muted-foreground">
                              {job.propertyCity}, {job.propertyState}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {job.scheduledStart ? (
                        <div className="text-sm">
                          <p>{format(new Date(job.scheduledStart), "MMM d, yyyy")}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(job.scheduledStart), "h:mm a")}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not scheduled</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {job.assignedFirstName ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback
                              className="text-[10px] text-white"
                              style={{ backgroundColor: job.assignedColor ?? "#6b7280" }}
                            >
                              {job.assignedFirstName[0]}
                              {job.assignedLastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {job.assignedFirstName} {job.assignedLastName?.[0]}.
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge type="job" status={job.status} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right">
                      {job.totalAmount
                        ? `$${Number(job.totalAmount).toFixed(2)}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <ListPagination meta={meta} onPageChange={goToPage} />
    </div>
  );
}
