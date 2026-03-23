export default function DashboardLoading() {
  return (
    <div>
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="h-9 w-16 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-4 w-28 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
