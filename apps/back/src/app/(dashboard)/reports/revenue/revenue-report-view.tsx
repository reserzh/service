"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { format } from "date-fns";

const methodLabels: Record<string, string> = {
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  ach: "ACH",
  cash: "Cash",
  check: "Check",
  other: "Other",
};

interface RevenueData {
  byPeriod: { period: string; total: number; count: number }[];
  summary: { totalRevenue: number; paymentCount: number; avgPayment: number };
  byMethod: { method: string; total: number; count: number }[];
}

interface Props {
  data: RevenueData;
  from: string;
  to: string;
  groupBy: string;
}

export function RevenueReportView({ data, from, to, groupBy }: Props) {
  const router = useRouter();
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);
  const [group, setGroup] = useState(groupBy);

  function applyFilters() {
    const params = new URLSearchParams();
    params.set("from", fromDate);
    params.set("to", toDate);
    params.set("groupBy", group);
    router.push(`/reports/revenue?${params.toString()}`);
  }

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

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
            <div className="space-y-1">
              <Label className="text-xs">Group by</Label>
              <Select value={group} onValueChange={setGroup}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={applyFilters}>Apply</Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">${fmt(data.summary.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Payments Collected</p>
            <p className="text-2xl font-bold">{data.summary.paymentCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Payment</p>
            <p className="text-2xl font-bold">${fmt(data.summary.avgPayment)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Period */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue by Period</CardTitle>
        </CardHeader>
        <CardContent>
          {data.byPeriod.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No payments in this period.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Payments</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byPeriod.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{format(new Date(row.period), group === "month" ? "MMM yyyy" : "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right font-medium">${fmt(row.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Revenue by Method */}
      {data.byMethod.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">% of Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byMethod.map((row) => (
                  <TableRow key={row.method}>
                    <TableCell>{methodLabels[row.method] ?? row.method}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right font-medium">${fmt(row.total)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {data.summary.totalRevenue > 0
                        ? `${((row.total / data.summary.totalRevenue) * 100).toFixed(1)}%`
                        : "0%"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
