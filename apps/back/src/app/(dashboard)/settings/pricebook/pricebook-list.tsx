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
import { Search, Package } from "lucide-react";
import Link from "next/link";
import { LINE_ITEM_TYPE_LABELS } from "@fieldservice/api-types/constants";
import type { PaginationMeta } from "@fieldservice/api-types/api";
import { Button } from "@/components/ui/button";

interface PricebookItem {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  category: string | null;
  type: string;
  unitPrice: string;
  unit: string | null;
  taxable: boolean;
  isActive: boolean;
}

interface PricebookListProps {
  items: PricebookItem[];
  meta: PaginationMeta;
  categories: string[];
  searchQuery?: string;
  activeCategory?: string;
  activeType?: string;
}

export function PricebookList({
  items,
  meta,
  categories,
  searchQuery,
  activeCategory,
  activeType,
}: PricebookListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { search: searchValue, handleChange: handleSearchChange } = useDebouncedSearch(
    "/settings/pricebook",
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
    router.push(`/settings/pricebook?${params.toString()}`);
  }

  const totalPages = Math.ceil(meta.total / meta.pageSize);

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search pricebook..."
            className="pl-9"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Select
          value={activeCategory || "all"}
          onValueChange={(v) => updateFilter("category", v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={activeType || "all"}
          onValueChange={(v) => updateFilter("type", v)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(LINE_ITEM_TYPE_LABELS).map(([key, label]) => (
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
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No pricebook items</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery || activeCategory || activeType
                ? "Try adjusting your filters."
                : "Add your first pricebook item to get started."}
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
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer">
                    <TableCell>
                      <Link
                        href={`/settings/pricebook/${item.id}`}
                        className="font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      {item.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.sku || "—"}
                    </TableCell>
                    <TableCell>
                      {item.category ? (
                        <Badge variant="outline">{item.category}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {LINE_ITEM_TYPE_LABELS[item.type as keyof typeof LINE_ITEM_TYPE_LABELS] || item.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${parseFloat(item.unitPrice).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.unit || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.pageSize + 1}–
            {Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => updateFilter("page", String(meta.page - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= totalPages}
              onClick={() => updateFilter("page", String(meta.page + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
