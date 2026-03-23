"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface FilterOption {
  value: string;
  label: string;
}

interface PortalFilterBarProps {
  basePath: string;
  statusOptions: FilterOption[];
  sortOptions?: FilterOption[];
}

export function PortalFilterBar({
  basePath,
  statusOptions,
  sortOptions,
}: PortalFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "";
  const currentSort = searchParams.get("sort") ?? "";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${basePath}?${params.toString()}`);
    },
    [router, searchParams, basePath]
  );

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <select
        value={currentStatus}
        onChange={(e) => updateParams("status", e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">All Statuses</option>
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {sortOptions && (
        <select
          value={currentSort}
          onChange={(e) => updateParams("sort", e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Newest First</option>
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {(currentStatus || currentSort) && (
        <button
          type="button"
          onClick={() => router.push(basePath)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
