import { useMemo } from "react";
import { startOfDay, endOfDay } from "date-fns";
import { useJobs } from "./useJobs";

export interface JobStats {
  total: number;
  inProgress: number;
  completed: number;
  earnings: number;
}

export function useJobStats() {
  const today = useMemo(() => new Date(), []);

  const params = useMemo(
    () => ({
      from: startOfDay(today).toISOString(),
      to: endOfDay(today).toISOString(),
      status: "scheduled,dispatched,in_progress,completed",
      sort: "scheduledStart",
      order: "asc" as const,
      pageSize: 50,
    }),
    [today]
  );

  const { data, isLoading, isError, refetch } = useJobs(params);
  const jobs = data?.data ?? [];

  const stats = useMemo<JobStats>(() => {
    const total = jobs.length;
    const inProgress = jobs.filter((j) => j.status === "in_progress").length;
    const completed = jobs.filter((j) => j.status === "completed").length;
    const earnings = jobs
      .filter((j) => j.status === "completed")
      .reduce((sum, j) => sum + (parseFloat(j.totalAmount ?? "0") || 0), 0);
    return { total, inProgress, completed, earnings };
  }, [jobs]);

  return { stats, jobs, isLoading, isError, refetch };
}
