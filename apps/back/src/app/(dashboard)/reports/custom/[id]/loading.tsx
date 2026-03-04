import { Skeleton } from "@/components/ui/skeleton";

export default function CustomReportLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-48" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
