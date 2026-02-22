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
import { Search, Filter, Receipt, AlertTriangle, CalendarDays, Download } from "lucide-react";
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
  paid: "Paid",
  partial: "Partial",
  overdue: "Overdue",
  void: "Void",
};

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  dueDate: string;
  subtotal: string;
  taxAmount: string;
  total: string;
  amountPaid: string;
  balanceDue: string;
  sentAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  customerId: string;
  customerFirstName: string | null;
  customerLastName: string | null;
  jobId: string | null;
}

interface InvoiceListProps {
  invoices: Invoice[];
  meta: { page: number; pageSize: number; total: number };
  searchQuery?: string;
  statusFilter?: string;
  dateFrom?: string;
  dateTo?: string;
}

const allStatuses = ["draft", "sent", "viewed", "paid", "partial", "overdue", "void"];

export function InvoiceList({ invoices, meta, searchQuery, statusFilter, dateFrom, dateTo }: InvoiceListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { search, handleChange: handleSearchChange, clearSearch } = useDebouncedSearch("/invoices", searchQuery);

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
      router.push(`/invoices?${params.toString()}`);
    },
    [router, searchParams]
  );

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      router.push(`/invoices?${params.toString()}`);
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
            placeholder="Search invoices..."
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

        <div className="hidden lg:flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="date"
            className="h-8 w-[140px]"
            value={dateFrom ?? ""}
            onChange={(e) => updateParams({ from: e.target.value || undefined })}
            aria-label="From date"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            className="h-8 w-[140px]"
            value={dateTo ?? ""}
            onChange={(e) => updateParams({ to: e.target.value || undefined })}
            aria-label="To date"
          />
        </div>

        {(search || activeStatuses.length > 0 || dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearSearch();
              router.push("/invoices");
            }}
          >
            Clear
          </Button>
        )}

        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href={`/api/v1/invoices/export?${searchParams.toString()}`} download>
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
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  {searchQuery || statusFilter ? (
                    <p className="text-center py-8 text-muted-foreground">No invoices match your filters.</p>
                  ) : (
                    <EmptyState
                      icon={Receipt}
                      title="No invoices yet"
                      description="Create your first invoice to start tracking payments and managing your accounts receivable."
                      actionLabel="Create Invoice"
                      actionHref="/invoices/new"
                    />
                  )}
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => {
                const balanceDue = Number(inv.balanceDue);
                const isPastDue =
                  balanceDue > 0 &&
                  !["paid", "void"].includes(inv.status) &&
                  new Date(inv.dueDate) < new Date();
                const effectiveStatus = isPastDue && inv.status !== "overdue" ? "overdue" : inv.status;

                return (
                  <TableRow key={inv.id} className={`group ${isPastDue ? "bg-status-overdue/5" : ""}`}>
                    <TableCell>
                      <Link href={`/invoices/${inv.id}`} className="block">
                        <span className="text-xs text-muted-foreground">{inv.invoiceNumber}</span>
                        <p className="font-medium group-hover:text-primary leading-tight transition-colors">
                          {format(new Date(inv.createdAt), "MMM d, yyyy")}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {inv.customerFirstName ? (
                        <p className="text-sm">{inv.customerFirstName} {inv.customerLastName}</p>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className={`text-sm ${isPastDue ? "text-destructive font-medium" : ""}`}>
                        {isPastDue && <AlertTriangle className="inline mr-1 h-3 w-3" />}
                        {format(new Date(inv.dueDate), "MMM d, yyyy")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge type="invoice" status={effectiveStatus} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${Number(inv.total).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right">
                      {balanceDue > 0 ? (
                        <span className="text-destructive font-medium">
                          ${balanceDue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">$0.00</span>
                      )}
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
