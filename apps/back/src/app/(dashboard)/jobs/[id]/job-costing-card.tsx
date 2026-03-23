"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Hammer,
  Timer,
} from "lucide-react";
import type { JobCostingResult } from "@/lib/services/job-costing";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

interface JobCostingCardProps {
  costing: JobCostingResult;
}

export function JobCostingCard({ costing }: JobCostingCardProps) {
  const isProfit = costing.profitLoss >= 0;
  const hasRevenue = costing.estimateBudget > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4" />
          Job Costing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Labor Cost */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Timer className="h-3.5 w-3.5" />
              Labor Cost
            </div>
            <p className="mt-1 text-lg font-semibold">
              {formatCurrency(costing.actualLaborCost)}
            </p>
            <p className="text-xs text-muted-foreground">
              {costing.actualLaborHours.toFixed(1)} hrs
            </p>
          </div>

          {/* Material Cost */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Hammer className="h-3.5 w-3.5" />
              Material Cost
            </div>
            <p className="mt-1 text-lg font-semibold">
              {formatCurrency(costing.actualMaterialCost)}
            </p>
          </div>

          {/* Revenue (Estimate Budget) */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              Revenue
            </div>
            <p className="mt-1 text-lg font-semibold">
              {formatCurrency(costing.estimateBudget)}
            </p>
          </div>

          {/* Profit / Loss */}
          <div className={`rounded-lg border p-3 ${isProfit ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950" : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"}`}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isProfit ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-600" />
              )}
              {isProfit ? "Profit" : "Loss"}
            </div>
            <p className={`mt-1 text-lg font-semibold ${isProfit ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
              {formatCurrency(Math.abs(costing.profitLoss))}
            </p>
          </div>

          {/* Margin % */}
          <div className={`rounded-lg border p-3 ${isProfit ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950" : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"}`}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {costing.profitMargin === 0 ? (
                <Minus className="h-3.5 w-3.5" />
              ) : isProfit ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-600" />
              )}
              Margin
            </div>
            <p className={`mt-1 text-lg font-semibold ${!hasRevenue ? "text-muted-foreground" : isProfit ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
              {hasRevenue ? `${costing.profitMargin.toFixed(1)}%` : "N/A"}
            </p>
          </div>
        </div>

        {/* Budget usage bar */}
        {hasRevenue && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Budget Used</span>
              <span>{costing.budgetUsedPercent.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  costing.budgetUsedPercent > 100
                    ? "bg-red-500"
                    : costing.budgetUsedPercent > 80
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(costing.budgetUsedPercent, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Schedule info */}
        {(costing.daysElapsed > 0 || costing.daysScheduled > 1) && (
          <div className="flex gap-6 text-xs text-muted-foreground">
            <span>Scheduled: {costing.daysScheduled} day{costing.daysScheduled !== 1 ? "s" : ""}</span>
            {costing.daysElapsed > 0 && (
              <span>Elapsed: {costing.daysElapsed} day{costing.daysElapsed !== 1 ? "s" : ""}</span>
            )}
          </div>
        )}

        {/* Daily Snapshots */}
        {costing.snapshots.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <h4 className="text-sm font-medium">Daily Snapshots</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead className="text-right">Labor</TableHead>
                  <TableHead className="text-right">Materials</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costing.snapshots.map((snap) => (
                  <TableRow key={snap.date}>
                    <TableCell className="text-sm">{snap.date}</TableCell>
                    <TableCell>
                      {snap.completionPercent != null ? (
                        <Badge variant="outline">{snap.completionPercent}%</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(snap.laborCost)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(snap.materialCost)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {snap.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
