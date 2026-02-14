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
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  viewed: { label: "Viewed", variant: "outline" },
  approved: { label: "Approved", variant: "default" },
  declined: { label: "Declined", variant: "destructive" },
  expired: { label: "Expired", variant: "secondary" },
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
              router.push("/estimates");
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
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  {searchQuery || statusFilter
                    ? "No estimates match your filters."
                    : "No estimates yet. Create your first estimate to get started."}
                </TableCell>
              </TableRow>
            ) : (
              estimates.map((est) => {
                const sc = statusConfig[est.status] ?? { label: est.status, variant: "secondary" as const };

                return (
                  <TableRow key={est.id}>
                    <TableCell>
                      <Link href={`/estimates/${est.id}`} className="block">
                        <span className="text-xs text-muted-foreground">{est.estimateNumber}</span>
                        <p className="font-medium hover:underline leading-tight">{est.summary}</p>
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
                      <Badge variant={sc.variant}>{sc.label}</Badge>
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {(meta.page - 1) * meta.pageSize + 1}-
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
