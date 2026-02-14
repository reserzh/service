"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  paid: "Paid",
  partial: "Partial",
  overdue: "Overdue",
  void: "Void",
};

const bucketLabels: Record<string, string> = {
  current: "Current",
  "1-30": "1-30 Days",
  "31-60": "31-60 Days",
  "61-90": "61-90 Days",
  "90+": "90+ Days",
};

const bucketOrder = ["current", "1-30", "31-60", "61-90", "90+"];

interface InvoiceReportData {
  byStatus: { status: string; count: number; totalAmount: number; balanceDue: number }[];
  aging: { bucket: string; count: number; balance: number }[];
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    invoiceCount: number;
    paidCount: number;
  };
}

interface Props {
  data: InvoiceReportData;
  from: string;
  to: string;
}

export function InvoiceReportView({ data, from, to }: Props) {
  const router = useRouter();
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);

  function applyFilters() {
    const params = new URLSearchParams();
    params.set("from", fromDate);
    params.set("to", toDate);
    router.push(`/reports/invoices?${params.toString()}`);
  }

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  // Sort aging by bucket order
  const sortedAging = [...data.aging].sort(
    (a, b) => bucketOrder.indexOf(a.bucket) - bucketOrder.indexOf(b.bucket)
  );
  const totalAgingBalance = sortedAging.reduce((sum, r) => sum + r.balance, 0);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
            </div>
            <Button onClick={applyFilters}>Apply</Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Invoiced</p>
            <p className="text-2xl font-bold">${fmt(data.summary.totalInvoiced)}</p>
            <p className="text-xs text-muted-foreground mt-1">{data.summary.invoiceCount} invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Collected</p>
            <p className="text-2xl font-bold text-green-600">${fmt(data.summary.totalPaid)}</p>
            <p className="text-xs text-muted-foreground mt-1">{data.summary.paidCount} paid in full</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className={`text-2xl font-bold ${data.summary.totalOutstanding > 0 ? "text-destructive" : ""}`}>
              ${fmt(data.summary.totalOutstanding)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Collection Rate</p>
            <p className="text-2xl font-bold">
              {data.summary.totalInvoiced > 0
                ? `${((data.summary.totalPaid / data.summary.totalInvoiced) * 100).toFixed(1)}%`
                : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AR Aging */}
      {sortedAging.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accounts Receivable Aging</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aging Bucket</TableHead>
                  <TableHead className="text-right">Invoices</TableHead>
                  <TableHead className="text-right">Balance Due</TableHead>
                  <TableHead className="text-right">% of AR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAging.map((row) => (
                  <TableRow key={row.bucket}>
                    <TableCell>
                      <Badge
                        variant={row.bucket === "current" ? "secondary" : row.bucket === "90+" ? "destructive" : "outline"}
                      >
                        {bucketLabels[row.bucket] ?? row.bucket}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right font-medium">${fmt(row.balance)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {totalAgingBalance > 0 ? `${((row.balance / totalAgingBalance) * 100).toFixed(1)}%` : "0%"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{sortedAging.reduce((s, r) => s + r.count, 0)}</TableCell>
                  <TableCell className="text-right">${fmt(totalAgingBalance)}</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* By Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoices by Status</CardTitle>
        </CardHeader>
        <CardContent>
          {data.byStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No invoices in this period.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Balance Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byStatus.map((row) => (
                  <TableRow key={row.status}>
                    <TableCell>
                      <Badge variant="outline">{statusLabels[row.status] ?? row.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right">${fmt(row.totalAmount)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {row.balanceDue > 0 ? (
                        <span className="text-destructive">${fmt(row.balanceDue)}</span>
                      ) : (
                        "$0.00"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
