export default function FolderListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 px-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-[120px] rounded-2xl bg-gray-200 animate-pulse" />
      ))}
    </div>
  );
}

