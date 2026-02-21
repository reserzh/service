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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Users, Download } from "lucide-react";
import { useCallback } from "react";
import { useDebouncedSearch } from "@/lib/hooks/use-debounced-search";
import { ListPagination } from "@/components/shared/list-pagination";
import { EmptyState } from "@/components/shared/empty-state";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  companyName: string | null;
  type: "residential" | "commercial";
  createdAt: Date;
}

interface CustomerListProps {
  customers: Customer[];
  meta: { page: number; pageSize: number; total: number };
  searchQuery?: string;
}

export function CustomerList({ customers, meta, searchQuery }: CustomerListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { search, handleChange, clearSearch } = useDebouncedSearch("/customers", searchQuery);

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      router.push(`/customers?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => handleChange(e.target.value)}
            className="pl-9"
          />
        </div>
        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
          >
            Clear
          </Button>
        )}

        <div className="ml-auto">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/v1/customers/export?${searchParams.toString()}`} download>
              <Download className="mr-2 h-3.5 w-3.5" />
              Export
            </a>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden sm:table-cell">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="p-0">
                  {searchQuery ? (
                    <p className="text-center py-8 text-muted-foreground">No customers match your search.</p>
                  ) : (
                    <EmptyState
                      icon={Users}
                      title="No customers yet"
                      description="Add your first customer to start managing their service requests, properties, and billing."
                    />
                  )}
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id} className="cursor-pointer">
                  <TableCell>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="font-medium hover:underline"
                    >
                      {customer.firstName} {customer.lastName}
                    </Link>
                    {customer.companyName && (
                      <p className="text-xs text-muted-foreground">
                        {customer.companyName}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {customer.email || "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={customer.type === "commercial" ? "default" : "secondary"}>
                      {customer.type}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <ListPagination meta={meta} onPageChange={goToPage} />
    </div>
  );
}
