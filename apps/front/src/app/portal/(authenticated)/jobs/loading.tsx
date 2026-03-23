export default function JobsLoading() {
  return (
    <div>
      <div className="mb-6 h-8 w-24 animate-pulse rounded bg-gray-200" />

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="bg-gray-50 px-6 py-3">
          <div className="flex gap-8">
            <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-6 py-4">
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200" />
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
