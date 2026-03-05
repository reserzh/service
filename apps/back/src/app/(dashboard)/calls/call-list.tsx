"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import Link from "next/link";
import {
  PhoneIncoming,
  PhoneOutgoing,
  Search,
  X,
  User,
  Briefcase,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CALL_DIRECTION_LABELS,
  CALL_STATUS_LABELS,
} from "@fieldservice/api-types/constants";
import { CALL_DIRECTIONS, CALL_STATUSES } from "@fieldservice/api-types/enums";

interface CallRow {
  id: string;
  direction: string;
  fromNumber: string;
  toNumber: string;
  status: string;
  duration: number | null;
  createdAt: Date | string;
  customer: { id: string; firstName: string; lastName: string; phone: string } | null;
  user: { id: string; firstName: string; lastName: string } | null;
  job: { id: string; jobNumber: string; summary: string } | null;
}

interface CallListProps {
  calls: CallRow[];
  meta: { page: number; pageSize: number; total: number };
  initialSearch: string;
  initialDirection: string;
  initialStatus: string;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === 0) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "in_progress":
      return "secondary";
    case "failed":
    case "busy":
    case "no_answer":
      return "destructive";
    default:
      return "outline";
  }
}

export function CallList({
  calls,
  meta,
  initialSearch,
  initialDirection,
  initialStatus,
}: CallListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      params.delete("page");
      router.push(`/calls?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = () => updateParams({ search });
  const clearSearch = () => {
    setSearch("");
    updateParams({ search: "" });
  };

  const totalPages = Math.ceil(meta.total / meta.pageSize);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select
          value={initialDirection || "all"}
          onValueChange={(v) => updateParams({ direction: v === "all" ? "" : v })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Directions</SelectItem>
            {CALL_DIRECTIONS.map((d) => (
              <SelectItem key={d} value={d}>
                {CALL_DIRECTION_LABELS[d]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={initialStatus || "all"}
          onValueChange={(v) => updateParams({ status: v === "all" ? "" : v })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {CALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {CALL_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>From / To</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No calls found.
                </TableCell>
              </TableRow>
            ) : (
              calls.map((call) => (
                <TableRow key={call.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link href={`/calls/${call.id}`} className="flex items-center">
                      {call.direction === "inbound" ? (
                        <PhoneIncoming className="h-4 w-4 text-green-600" />
                      ) : (
                        <PhoneOutgoing className="h-4 w-4 text-blue-600" />
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/calls/${call.id}`} className="block">
                      <p className="text-sm font-medium">{call.fromNumber}</p>
                      <p className="text-xs text-muted-foreground">{call.toNumber}</p>
                    </Link>
                  </TableCell>
                  <TableCell>
                    {call.customer ? (
                      <Link
                        href={`/customers/${call.customer.id}`}
                        className="text-sm hover:underline"
                      >
                        {call.customer.firstName} {call.customer.lastName}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDuration(call.duration)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(call.status)}>
                      {CALL_STATUS_LABELS[call.status as keyof typeof CALL_STATUS_LABELS] ?? call.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {call.user
                      ? `${call.user.firstName} ${call.user.lastName}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(call.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
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
            {meta.total} call{meta.total !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(meta.page - 1));
                router.push(`/calls?${params.toString()}`);
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= totalPages}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(meta.page + 1));
                router.push(`/calls?${params.toString()}`);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
