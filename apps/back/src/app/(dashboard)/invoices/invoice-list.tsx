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
import { Receipt, AlertTriangle } from "lucide-react";
import { useCallback } from "react";
import { ListPagination } from "@/components/shared/list-pagination";
import { ListToolbar, type FilterConfig } from "@/components/shared/list-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { format } from "date-fns";

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

const invoiceFilters: FilterConfig[] = [
  {
    key: "status",
    label: "Status",
    multi: true,
    options: [
      { value: "draft", label: "Draft" },
      { value: "sent", label: "Sent" },
      { value: "viewed", label: "Viewed" },
      { value: "paid", label: "Paid" },
      { value: "partial", label: "Partial" },
      { value: "overdue", label: "Overdue" },
      { value: "void", label: "Void" },
    ],
  },
];

export function InvoiceList({ invoices, meta, searchQuery, statusFilter, dateFrom, dateTo }: InvoiceListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      router.push(`/invoices?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <ListToolbar
        basePath="/invoices"
        searchPlaceholder="Search invoices..."
        searchQuery={searchQuery}
        filters={invoiceFilters}
        activeFilters={{ status: statusFilter ?? "" }}
        showDateRange
        dateFrom={dateFrom}
        dateTo={dateTo}
        exportUrl="/api/v1/invoices/export"
      />

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
