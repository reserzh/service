"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { retryQBSyncAction } from "@/actions/quickbooks";
import { showToast } from "@/lib/toast";

interface SyncLogEntry {
  id: string;
  entityType: string;
  localEntityId: string;
  qbEntityId: string | null;
  operation: string;
  status: string;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: Date;
}

interface Props {
  data: SyncLogEntry[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
  filters: {
    entityType?: string;
    status?: string;
  };
}

export function SyncLogTable({ data, meta, filters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [retrying, setRetrying] = useState<string | null>(null);

  const totalPages = Math.ceil(meta.total / meta.pageSize);

  function updateFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`?${params.toString()}`);
  }

  async function handleRetry(entityType: string, localEntityId: string) {
    setRetrying(localEntityId);
    try {
      const result = await retryQBSyncAction(entityType, localEntityId);
      if (result.error) {
        showToast.error("Retry failed", result.error);
      } else {
        showToast.success("Sync retried successfully");
        router.refresh();
      }
    } finally {
      setRetrying(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <Select
          value={filters.entityType ?? "all"}
          onValueChange={(v) => updateFilter("entityType", v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Entity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="invoice">Invoice</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="pricebook_item">Pricebook Item</SelectItem>
            <SelectItem value="estimate">Estimate</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) => updateFilter("status", v)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity Type</TableHead>
              <TableHead>Operation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>QB ID</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No sync log entries found
                </TableCell>
              </TableRow>
            ) : (
              data.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="capitalize">
                    {entry.entityType.replace("_", " ")}
                  </TableCell>
                  <TableCell className="capitalize">{entry.operation}</TableCell>
                  <TableCell>
                    <Badge variant={entry.status === "success" ? "default" : "destructive"}>
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.qbEntityId ?? "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.durationMs ? `${entry.durationMs}ms` : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {entry.status === "error" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRetry(entry.entityType, entry.localEntityId)}
                        disabled={retrying === entry.localEntityId}
                        title="Retry sync"
                      >
                        <RefreshCw className={`h-4 w-4 ${retrying === entry.localEntityId ? "animate-spin" : ""}`} />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.pageSize + 1}-
            {Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(meta.page - 1)}
              disabled={meta.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(meta.page + 1)}
              disabled={meta.page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
