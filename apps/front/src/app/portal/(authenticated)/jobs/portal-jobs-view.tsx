"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { JOB_STATUS_LABELS } from "@fieldservice/api-types/constants";
import type { JobStatus } from "@fieldservice/api-types/enums";
import { EmptyState } from "@/components/portal/empty-state";

const statusColors: Record<JobStatus, { bg: string; text: string }> = {
  new: { bg: "bg-gray-100", text: "text-gray-700" },
  scheduled: { bg: "bg-yellow-100", text: "text-yellow-800" },
  dispatched: { bg: "bg-purple-100", text: "text-purple-800" },
  en_route: { bg: "bg-indigo-100", text: "text-indigo-800" },
  in_progress: { bg: "bg-blue-100", text: "text-blue-800" },
  completed: { bg: "bg-green-100", text: "text-green-800" },
  canceled: { bg: "bg-red-100", text: "text-red-700" },
};

const ACTIVE_STATUSES = new Set<string>([
  "scheduled",
  "dispatched",
  "en_route",
  "in_progress",
]);

type PortalJob = {
  id: string;
  jobNumber: string;
  summary: string | null;
  status: string;
  priority: string | null;
  jobType: string | null;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  propertyId: string | null;
  propertyName: string | null;
  propertyAddress: string | null;
  propertyCity: string | null;
  propertyState: string | null;
  propertyZip: string | null;
};

interface PortalJobsViewProps {
  jobs: PortalJob[];
}

function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const colors = statusColors[status as JobStatus] ?? {
    bg: "bg-gray-100",
    text: "text-gray-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      {JOB_STATUS_LABELS[status as JobStatus] ?? status}
    </span>
  );
}

function JobTable({ jobs }: { jobs: PortalJob[] }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Job Number
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Summary
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Scheduled Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4 text-sm">
                <Link
                  href={`/portal/jobs/${job.id}`}
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  #{job.jobNumber}
                </Link>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                <Link
                  href={`/portal/jobs/${job.id}`}
                  className="hover:text-blue-600"
                >
                  {job.summary || "-"}
                </Link>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm">
                <StatusBadge status={job.status} />
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {formatDate(job.scheduledStart)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type PropertyGroup = {
  propertyId: string | null;
  propertyName: string | null;
  propertyAddress: string | null;
  propertyCity: string | null;
  propertyState: string | null;
  propertyZip: string | null;
  jobs: PortalJob[];
  activeCount: number;
  completedCount: number;
};

function groupJobsByProperty(jobs: PortalJob[]): PropertyGroup[] {
  const map = new Map<string, PropertyGroup>();

  for (const job of jobs) {
    const key = job.propertyId ?? "__no_property__";
    let group = map.get(key);
    if (!group) {
      group = {
        propertyId: job.propertyId,
        propertyName: job.propertyName,
        propertyAddress: job.propertyAddress,
        propertyCity: job.propertyCity,
        propertyState: job.propertyState,
        propertyZip: job.propertyZip,
        jobs: [],
        activeCount: 0,
        completedCount: 0,
      };
      map.set(key, group);
    }
    group.jobs.push(job);
    if (ACTIVE_STATUSES.has(job.status)) {
      group.activeCount++;
    } else if (job.status === "completed") {
      group.completedCount++;
    }
  }

  // Sort groups by address, with no-property group last
  const groups = Array.from(map.values());
  groups.sort((a, b) => {
    if (!a.propertyAddress) return 1;
    if (!b.propertyAddress) return -1;
    return a.propertyAddress.localeCompare(b.propertyAddress);
  });

  // Sort jobs within each group by scheduledStart desc
  for (const group of groups) {
    group.jobs.sort((a, b) => {
      const aDate = a.scheduledStart ? new Date(a.scheduledStart).getTime() : 0;
      const bDate = b.scheduledStart ? new Date(b.scheduledStart).getTime() : 0;
      return bDate - aDate;
    });
  }

  return groups;
}

function PropertyCard({ group }: { group: PropertyGroup }) {
  const [expanded, setExpanded] = useState(group.activeCount > 0);
  const displayName = group.propertyName || "Primary Property";
  const addressParts = [
    group.propertyAddress,
    group.propertyCity,
    group.propertyState,
    group.propertyZip,
  ].filter(Boolean);
  const address = addressParts.length > 0 ? addressParts.join(", ") : "No address";

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50"
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900">{displayName}</h3>
          <p className="mt-0.5 text-sm text-gray-500">{address}</p>
        </div>
        <div className="ml-4 flex shrink-0 items-center gap-3">
          {group.activeCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              {group.activeCount} active
            </span>
          )}
          {group.completedCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              {group.completedCount} completed
            </span>
          )}
          <span className="text-xs text-gray-400">
            {group.jobs.length} total
          </span>
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>
      {expanded && (
        <div className="border-t">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Job Number
                </th>
                <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Summary
                </th>
                <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {group.jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-3 text-sm">
                    <Link
                      href={`/portal/jobs/${job.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      #{job.jobNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900">
                    <Link
                      href={`/portal/jobs/${job.id}`}
                      className="hover:text-blue-600"
                    >
                      {job.summary || "-"}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-500">
                    {formatDate(job.scheduledStart)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ByPropertyView({ jobs }: { jobs: PortalJob[] }) {
  const groups = groupJobsByProperty(jobs);
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <PropertyCard
          key={group.propertyId ?? "__no_property__"}
          group={group}
        />
      ))}
    </div>
  );
}

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "canceled", label: "Canceled" },
];

export function PortalJobsView({ jobs }: PortalJobsViewProps) {
  const [view, setView] = useState<"all" | "by-property">("all");
  const [statusFilter, setStatusFilter] = useState("");

  // Determine if there are multiple properties to make the tab useful
  const propertyIds = new Set(jobs.map((j) => j.propertyId ?? "__none__"));
  const hasMultipleProperties = propertyIds.size > 1;

  const filteredJobs = jobs.filter((job) => {
    if (!statusFilter) return true;
    if (statusFilter === "active") return ACTIVE_STATUSES.has(job.status) || job.status === "new";
    return job.status === statusFilter;
  });

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No jobs yet"
        description="Your jobs will appear here once they are scheduled."
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {hasMultipleProperties && (
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setView("all")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                view === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Jobs
            </button>
            <button
              type="button"
              onClick={() => setView("by-property")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                view === "by-property"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              By Property
            </button>
          </div>
        )}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {filteredJobs.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">No jobs match the selected filter.</p>
      ) : view === "all" ? (
        <JobTable jobs={filteredJobs} />
      ) : (
        <ByPropertyView jobs={filteredJobs} />
      )}
    </div>
  );
}
