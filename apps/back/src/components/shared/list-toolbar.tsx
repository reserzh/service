"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, CalendarDays, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCallback } from "react";
import { useDebouncedSearch } from "@/lib/hooks/use-debounced-search";

export interface FilterConfig {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  multi?: boolean;
}

export interface ListToolbarProps {
  basePath: string;
  searchPlaceholder?: string;
  searchQuery?: string;
  filters?: FilterConfig[];
  activeFilters?: Record<string, string>;
  showDateRange?: boolean;
  dateFrom?: string;
  dateTo?: string;
  exportUrl?: string;
}

export function ListToolbar({
  basePath,
  searchPlaceholder = "Search...",
  searchQuery,
  filters = [],
  activeFilters = {},
  showDateRange = false,
  dateFrom,
  dateTo,
  exportUrl,
}: ListToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { search, handleChange: handleSearchChange, clearSearch } = useDebouncedSearch(basePath, searchQuery);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      params.delete("page");
      router.push(`${basePath}?${params.toString()}`);
    },
    [router, searchParams, basePath]
  );

  function toggleMultiFilter(key: string, value: string) {
    const current = new Set(activeFilters[key] ? activeFilters[key].split(",") : []);
    if (current.has(value)) {
      current.delete(value);
    } else {
      current.add(value);
    }
    const result = current.size > 0 ? Array.from(current).join(",") : undefined;
    updateParams({ [key]: result });
  }

  function toggleSingleFilter(key: string, value: string) {
    updateParams({ [key]: activeFilters[key] === value ? undefined : value });
  }

  const hasActiveFilters =
    !!search ||
    Object.values(activeFilters).some((v) => !!v) ||
    !!dateFrom ||
    !!dateTo;

  return (
    <div className="flex items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter dropdowns */}
      {filters.map((filter) => {
        const activeValues = activeFilters[filter.key]
          ? activeFilters[filter.key].split(",")
          : [];
        const activeCount = filter.multi
          ? activeValues.length
          : activeFilters[filter.key]
            ? 1
            : 0;

        return (
          <DropdownMenu key={filter.key}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-3.5 w-3.5" />
                {filter.label}
                {activeCount > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                    {activeCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {filter.options.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={
                    filter.multi
                      ? activeValues.includes(opt.value)
                      : activeFilters[filter.key] === opt.value
                  }
                  onCheckedChange={() =>
                    filter.multi
                      ? toggleMultiFilter(filter.key, opt.value)
                      : toggleSingleFilter(filter.key, opt.value)
                  }
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}

      {/* Date range */}
      {showDateRange && (
        <div className="hidden lg:flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="date"
            className="h-8 w-[140px]"
            value={dateFrom ?? ""}
            onChange={(e) => updateParams({ from: e.target.value || undefined })}
            aria-label="From date"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            className="h-8 w-[140px]"
            value={dateTo ?? ""}
            onChange={(e) => updateParams({ to: e.target.value || undefined })}
            aria-label="To date"
          />
        </div>
      )}

      {/* Clear button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clearSearch();
            router.push(basePath);
          }}
        >
          Clear
        </Button>
      )}

      {/* Export button */}
      {exportUrl && (
        <div className="ml-auto">
          <Button variant="outline" size="sm" asChild>
            <a href={`${exportUrl}?${searchParams.toString()}`} download>
              <Download className="mr-2 h-3.5 w-3.5" />
              Export
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
