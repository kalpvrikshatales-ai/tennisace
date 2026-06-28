export default function MatchCardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="h-[3px] w-full bg-gray-200" />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded-full w-16" />
              <div className="h-6 bg-gray-200 rounded-full w-12" />
            </div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>

        {/* Players */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="h-4 bg-gray-200 rounded flex-1 max-w-xs" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-8" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="h-4 bg-gray-200 rounded flex-1 max-w-xs" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-8" />
          </div>
        </div>

        {/* Voting */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
          <div className="space-y-1.5">
            <div className="h-6 bg-gray-200 rounded" />
            <div className="h-6 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
