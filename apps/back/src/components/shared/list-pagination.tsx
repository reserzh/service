"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ListPaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

interface ListPaginationProps {
  meta: ListPaginationMeta;
  onPageChange: (page: number) => void;
}

export function ListPagination({ meta, onPageChange }: ListPaginationProps) {
  const totalPages = Math.ceil(meta.total / meta.pageSize);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <p>
        Showing {(meta.page - 1) * meta.pageSize + 1}&ndash;
        {Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span aria-live="polite">
          Page {meta.page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={meta.page >= totalPages}
          onClick={() => onPageChange(meta.page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
