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
  paid: { label: "Paid", variant: "default" },
  partial: { label: "Partial", variant: "outline" },
  overdue: { label: "Overdue", variant: "destructive" },
  void: { label: "Void", variant: "secondary" },
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
}

const allStatuses = ["draft", "sent", "viewed", "paid", "partial", "overdue", "void"];

export function InvoiceList({ invoices, meta, searchQuery, statusFilter }: InvoiceListProps) {
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
              router.push("/invoices");
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
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {searchQuery || statusFilter
                    ? "No invoices match your filters."
                    : "No invoices yet. Create your first invoice to get started."}
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => {
                const sc = statusConfig[inv.status] ?? { label: inv.status, variant: "secondary" as const };
                const balanceDue = Number(inv.balanceDue);

                return (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <Link href={`/invoices/${inv.id}`} className="block">
                        <span className="text-xs text-muted-foreground">{inv.invoiceNumber}</span>
                        <p className="font-medium hover:underline leading-tight">
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
                      <span className="text-sm">{format(new Date(inv.dueDate), "MMM d, yyyy")}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sc.variant}>{sc.label}</Badge>
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
