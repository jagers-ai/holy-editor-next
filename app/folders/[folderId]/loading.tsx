export default function Loading() {
  const Skeleton = () => (
    <div className="animate-pulse">
      <div className="h-6 w-40 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-24 bg-gray-200 rounded" />
    </div>
  );

  return (
    <div className="max-w-full mx-auto px-3 py-4 pb-24">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-5 w-5 bg-gray-200 rounded-full" />
        <div>
          <Skeleton />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="h-28 rounded-md bg-gray-200 mb-2 animate-pulse" />
            <div className="space-y-1 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

