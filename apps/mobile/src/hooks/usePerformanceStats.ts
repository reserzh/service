import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/endpoints/users";

export interface PerformanceStats {
  jobsCompleted: number;
  avgDurationMinutes: number;
  revenue: number;
  rating: number | null;
}

export function usePerformanceStats() {
  return useQuery({
    queryKey: ["performance-stats"],
    queryFn: () => usersApi.getPerformanceStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
