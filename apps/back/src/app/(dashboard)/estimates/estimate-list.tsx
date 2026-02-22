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
import { StatusBadge } from "@/components/shared/status-badge";
import { Search, Filter, FileText, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCallback } from "react";
import { useDebouncedSearch } from "@/lib/hooks/use-debounced-search";
import { ListPagination } from "@/components/shared/list-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { format } from "date-fns";

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  approved: "Approved",
  declined: "Declined",
  expired: "Expired",
};

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

const allStatuses = ["draft", "sent", "viewed", "approved", "declined", "expired"];

export function EstimateList({ estimates, meta, searchQuery, statusFilter }: EstimateListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { search, handleChange: handleSearchChange, clearSearch } = useDebouncedSearch("/estimates", searchQuery);

  const activeStatuses = statusFilter ? statusFilter.split(",") : [];

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
      router.push(`/estimates?${params.toString()}`);
    },
    [router, searchParams]
  );

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      router.push(`/estimates?${params.toString()}`);
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
            placeholder="Search estimates..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
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
                {statusLabels[s] ?? s}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {(search || activeStatuses.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearSearch();
              if (activeStatuses.length > 0) {
                router.push("/estimates");
              }
            }}
          >
            Clear
          </Button>
        )}

        <div className="ml-auto">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/v1/estimates/export?${searchParams.toString()}`} download>
              <Download className="mr-2 h-3.5 w-3.5" />
              Export
            </a>
          </Button>
        </div>
      </div>

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
