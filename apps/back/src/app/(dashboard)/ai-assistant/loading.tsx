import { Skeleton } from "@/components/ui/skeleton";

export default function AIAssistantLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0">
      {/* Sidebar skeleton */}
      <div className="hidden w-72 border-r p-4 lg:block">
        <Skeleton className="mb-4 h-9 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
      {/* Chat area skeleton */}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex-1 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
            >
              <Skeleton
                className={`h-16 ${i % 2 === 0 ? "w-1/3" : "w-2/3"} rounded-xl`}
              />
            </div>
          ))}
        </div>
        <Skeleton className="mt-4 h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
