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
import { Search, Wrench } from "lucide-react";
import Link from "next/link";

interface EquipmentItem {
  id: string;
  name: string;
  type: string;
  serialNumber: string | null;
  brand: string | null;
  model: string | null;
  lastServiceDate: string | null;
  nextServiceDue: string | null;
  hoursUsed: number | null;
  serviceIntervalDays: number | null;
  serviceIntervalHours: number | null;
  status: string;
  assignedTo: string | null;
  assignedFirstName: string | null;
  assignedLastName: string | null;
  notes: string | null;
  createdAt: Date;
}

interface EquipmentListProps {
  items: EquipmentItem[];
  searchQuery?: string;
  activeStatus?: string;
}

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  in_use: "In Use",
  maintenance: "Maintenance",
  retired: "Retired",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  available: "default",
  in_use: "secondary",
  maintenance: "outline",
  retired: "destructive",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString();
}

function isOverdue(nextServiceDue: string | null): boolean {
  if (!nextServiceDue) return false;
  return new Date(nextServiceDue) < new Date();
}

export function EquipmentList({
  items,
  searchQuery,
  activeStatus,
}: EquipmentListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { search: searchValue, handleChange: handleSearchChange } = useDebouncedSearch(
    "/settings/equipment",
    searchQuery || ""
  );

  function updateFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/settings/equipment?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search equipment..."
            className="pl-9"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Select
          value={activeStatus || "all"}
          onValueChange={(v) => updateFilter("status", v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <Wrench className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No equipment found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery || activeStatus
                ? "Try adjusting your filters."
                : "Add your first piece of equipment to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Next Service</TableHead>
                  <TableHead>Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer">
                    <TableCell>
                      <Link
                        href={`/settings/equipment/${item.id}`}
                        className="font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      {item.brand && item.model && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.brand} {item.model}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[item.status] || "secondary"}>
                        {STATUS_LABELS[item.status] || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.assignedFirstName && item.assignedLastName
                        ? `${item.assignedFirstName} ${item.assignedLastName}`
                        : "\u2014"}
                    </TableCell>
                    <TableCell>
                      {item.nextServiceDue ? (
                        <span className={isOverdue(item.nextServiceDue) ? "font-medium text-destructive" : ""}>
                          {formatDate(item.nextServiceDue)}
                          {isOverdue(item.nextServiceDue) && " (overdue)"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{"\u2014"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.hoursUsed ?? 0}h
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
