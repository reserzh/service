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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useCallback } from "react";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: "New", variant: "secondary" },
  scheduled: { label: "Scheduled", variant: "default" },
  dispatched: { label: "Dispatched", variant: "default" },
  in_progress: { label: "In Progress", variant: "outline" },
  completed: { label: "Completed", variant: "secondary" },
  canceled: { label: "Canceled", variant: "destructive" },
};

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
}

const allStatuses = ["new", "scheduled", "dispatched", "in_progress", "completed", "canceled"];

export function JobList({ jobs, meta, searchQuery, statusFilter }: JobListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchQuery || "");

  const activeStatuses = statusFilter ? statusFilter.split(",") : [];
  const totalPages = Math.ceil(meta.total / meta.pageSize);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      params.delete("page");
      router.push(`/jobs?${params.toString()}`);
    },
    [router, searchParams]
  );

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      router.push(`/jobs?${params.toString()}`);
    },
    [router, searchParams]
  );

  function toggleStatus(status: string) {
    const current = new Set(activeStatuses);
    if (current.has(status)) {
      current.delete(status);
    } else {
      current.add(status);
    }
    const value = current.size > 0 ? Array.from(current).join(",") : undefined;
    updateParams({ status: value });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateParams({ search: search || undefined });
            }}
            className="pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-3.5 w-3.5" />
              Status
              {activeStatuses.length > 0 && (
                <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                  {activeStatuses.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {allStatuses.map((s) => (
              <DropdownMenuCheckboxItem
                key={s}
                checked={activeStatuses.includes(s)}
                onCheckedChange={() => toggleStatus(s)}
              >
                {statusConfig[s]?.label ?? s}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {(search || activeStatuses.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              router.push("/jobs");
            }}
          >
            Clear
          </Button>
        )}
      </div>

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
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {searchQuery || statusFilter
                    ? "No jobs match your filters."
                    : "No jobs yet. Create your first job to get started."}
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => {
                const sc = statusConfig[job.status] ?? { label: job.status, variant: "secondary" as const };
                const pc = priorityConfig[job.priority] ?? priorityConfig.normal;

                return (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Link href={`/jobs/${job.id}`} className="block">
                        <span className="text-xs text-muted-foreground">{job.jobNumber}</span>
                        <p className="font-medium hover:underline leading-tight">{job.summary}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {job.jobType}
                          {job.priority !== "normal" && (
                            <span className={`ml-2 ${pc.className}`}>{pc.label}</span>
                          )}
                        </p>
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
                      <Badge variant={sc.variant}>{sc.label}</Badge>
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {(meta.page - 1) * meta.pageSize + 1}–
            {Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={meta.page <= 1}
              onClick={() => goToPage(meta.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>Page {meta.page} of {totalPages}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={meta.page >= totalPages}
              onClick={() => goToPage(meta.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
