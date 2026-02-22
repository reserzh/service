"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedSearch } from "@/lib/hooks/use-debounced-search";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Search, ClipboardList } from "lucide-react";
import Link from "next/link";
import {
  AGREEMENT_STATUS_LABELS,
  BILLING_FREQUENCY_LABELS,
} from "@fieldservice/api-types/constants";
import type { PaginationMeta } from "@fieldservice/api-types/api";
import { Button } from "@/components/ui/button";

interface AgreementListItem {
  id: string;
  agreementNumber: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  billingFrequency: string;
  billingAmount: string;
  totalValue: string;
  visitsPerYear: number;
  autoRenew: boolean;
  customerFirstName: string | null;
  customerLastName: string | null;
}

interface AgreementListProps {
  agreements: AgreementListItem[];
  meta: PaginationMeta;
  searchQuery?: string;
  activeStatus?: string;
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  active: "default",
  paused: "outline",
  completed: "secondary",
  canceled: "destructive",
};

export function AgreementList({ agreements, meta, searchQuery, activeStatus }: AgreementListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { search: searchValue, handleChange: handleSearchChange } = useDebouncedSearch(
    "/agreements",
    searchQuery || ""
  );

  function updateFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/agreements?${params.toString()}`);
  }

  const totalPages = Math.ceil(meta.total / meta.pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search agreements..."
            className="pl-9"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Select
          value={activeStatus || "all"}
          onValueChange={(v) => updateFilter("status", v)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(AGREEMENT_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {agreements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No agreements</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery || activeStatus
                ? "Try adjusting your filters."
                : "Create your first service agreement to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agreement</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agreements.map((agr) => (
                  <TableRow key={agr.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/agreements/${agr.id}`} className="font-medium hover:underline">
                        {agr.agreementNumber}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">{agr.name}</p>
                    </TableCell>
                    <TableCell>
                      {agr.customerFirstName} {agr.customerLastName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[agr.status] || "secondary"}>
                        {AGREEMENT_STATUS_LABELS[agr.status as keyof typeof AGREEMENT_STATUS_LABELS] || agr.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {agr.startDate} — {agr.endDate}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        ${parseFloat(agr.billingAmount).toFixed(2)}{" "}
                        <span className="text-muted-foreground">
                          / {BILLING_FREQUENCY_LABELS[agr.billingFrequency as keyof typeof BILLING_FREQUENCY_LABELS] || agr.billingFrequency}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${parseFloat(agr.totalValue).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.pageSize + 1}–
            {Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => updateFilter("page", String(meta.page - 1))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={meta.page >= totalPages} onClick={() => updateFilter("page", String(meta.page + 1))}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
