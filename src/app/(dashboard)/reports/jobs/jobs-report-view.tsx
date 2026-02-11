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
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

const statusLabels: Record<string, string> = {
  new: "New",
  scheduled: "Scheduled",
  dispatched: "Dispatched",
  in_progress: "In Progress",
  completed: "Completed",
  canceled: "Canceled",
};

interface JobsData {
  byStatus: { status: string; count: number; totalAmount: number }[];
  byType: { jobType: string; count: number; totalAmount: number }[];
  byDay: { day: string; count: number }[];
  summary: {
    total: number;
    completed: number;
    canceled: number;
    totalRevenue: number;
    avgJobValue: number;
  };
}

interface Props {
  data: JobsData;
  from: string;
  to: string;
}

export function JobsReportView({ data, from, to }: Props) {
  const router = useRouter();
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);

  function applyFilters() {
    const params = new URLSearchParams();
    params.set("from", fromDate);
    params.set("to", toDate);
    router.push(`/reports/jobs?${params.toString()}`);
  }

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });
  const completionRate = data.summary.total > 0
    ? ((data.summary.completed / data.summary.total) * 100).toFixed(1)
    : "0";

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
            <p className="text-sm text-muted-foreground">Total Jobs</p>
            <p className="text-2xl font-bold">{data.summary.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold">{data.summary.completed}</p>
            <div className="mt-2">
              <Progress value={Number(completionRate)} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{completionRate}% completion rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">${fmt(data.summary.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Job Value</p>
            <p className="text-2xl font-bold">${fmt(data.summary.avgJobValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* By Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Jobs by Status</CardTitle>
        </CardHeader>
        <CardContent>
          {data.byStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No jobs in this period.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byStatus.map((row) => (
                  <TableRow key={row.status}>
                    <TableCell>
                      <Badge variant="outline">{statusLabels[row.status] ?? row.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {data.summary.total > 0 ? `${((row.count / data.summary.total) * 100).toFixed(1)}%` : "0%"}
                    </TableCell>
                    <TableCell className="text-right font-medium">${fmt(row.totalAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* By Type */}
      {data.byType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jobs by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Type</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Avg Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byType.map((row) => (
                  <TableRow key={row.jobType}>
                    <TableCell className="font-medium">{row.jobType}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right">${fmt(row.totalAmount)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ${fmt(row.count > 0 ? row.totalAmount / row.count : 0)}
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
