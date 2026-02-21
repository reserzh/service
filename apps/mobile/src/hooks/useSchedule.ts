import { useQuery } from "@tanstack/react-query";
import { scheduleApi, type ScheduleParams } from "@/api/endpoints/schedule";

export function useSchedule(params: ScheduleParams) {
  return useQuery({
    queryKey: ["schedule", params],
    queryFn: () => scheduleApi.get(params),
    enabled: !!params.from && !!params.to,
  });
}
