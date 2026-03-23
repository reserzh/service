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
import { StatusBadge } from "@/components/shared/status-badge";
import { FileText } from "lucide-react";
import { useCallback } from "react";
import { ListPagination } from "@/components/shared/list-pagination";
import { ListToolbar, type FilterConfig } from "@/components/shared/list-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { format } from "date-fns";

interface Estimate {
  id: string;
  estimateNumber: string;
  summary: string;
  status: string;
  totalAmount: string | null;
  validUntil: string | null;
  sentAt: Date | null;
  approvedAt: Date | null;
  createdAt: Date;
  customerId: string;
  customerFirstName: string | null;
  customerLastName: string | null;
  jobId: string | null;
}

interface EstimateListProps {
  estimates: Estimate[];
  meta: { page: number; pageSize: number; total: number };
  searchQuery?: string;
  statusFilter?: string;
}

const estimateFilters: FilterConfig[] = [
  {
    key: "status",
    label: "Status",
    multi: true,
    options: [
      { value: "draft", label: "Draft" },
      { value: "sent", label: "Sent" },
      { value: "viewed", label: "Viewed" },
      { value: "approved", label: "Approved" },
      { value: "declined", label: "Declined" },
      { value: "expired", label: "Expired" },
    ],
  },
];

export function EstimateList({ estimates, meta, searchQuery, statusFilter }: EstimateListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      router.push(`/estimates?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <ListToolbar
        basePath="/estimates"
        searchPlaceholder="Search estimates..."
        searchQuery={searchQuery}
        filters={estimateFilters}
        activeFilters={{ status: statusFilter ?? "" }}
        exportUrl="/api/v1/estimates/export"
      />

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estimate</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Valid Until</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estimates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  {searchQuery || statusFilter ? (
                    <p className="text-center py-8 text-muted-foreground">No estimates match your filters.</p>
                  ) : (
                    <EmptyState
                      icon={FileText}
                      title="No estimates yet"
                      description="Create your first estimate to start sending professional quotes with Good/Better/Best options to your customers."
                      actionLabel="Create Estimate"
                      actionHref="/estimates/new"
                    />
                  )}
                </TableCell>
              </TableRow>
            ) : (
              estimates.map((est) => {
                return (
                  <TableRow key={est.id} className="group">
                    <TableCell>
                      <Link href={`/estimates/${est.id}`} className="block">
                        <span className="text-xs text-muted-foreground">{est.estimateNumber}</span>
                        <p className="font-medium group-hover:text-primary leading-tight transition-colors">{est.summary}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(est.createdAt), "MMM d, yyyy")}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {est.customerFirstName ? (
                        <p className="text-sm">{est.customerFirstName} {est.customerLastName}</p>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {est.validUntil ? (
                        <span className="text-sm">{format(new Date(est.validUntil), "MMM d, yyyy")}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No expiry</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge type="estimate" status={est.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {est.totalAmount
                        ? `$${Number(est.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                        : "-"}
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
