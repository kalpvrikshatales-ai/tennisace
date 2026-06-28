export default function ResultCardSkeleton() {
  return (
    <div className="card h-[72px] animate-pulse flex items-center gap-3 px-4">
      <div className="w-2 h-2 rounded-full bg-gray-200 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-32" />
        <div className="h-3 bg-gray-200 rounded w-48" />
      </div>
      <div className="flex-shrink-0 text-right space-y-2">
        <div className="h-3 bg-gray-200 rounded w-12" />
        <div className="h-3 bg-gray-200 rounded w-16" />
      </div>
    </div>
  )
}
