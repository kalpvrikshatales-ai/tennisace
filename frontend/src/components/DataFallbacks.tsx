/**
 * Fallback UI components for when data is unavailable
 * Ensures users never see blank screens
 */

export function RankingsFallback() {
  return (
    <div className="card p-6 text-center">
      <p className="text-2xl mb-2">📊</p>
      <p className="font-bold text-gray-900 text-[14px]">Rankings loading</p>
      <p className="text-gray-400 text-[12px] mt-2">
        Using cached data from your last visit
      </p>
    </div>
  )
}

export function LiveMatchesFallback() {
  return (
    <div className="card p-6 text-center">
      <p className="text-2xl mb-2">🔴</p>
      <p className="font-bold text-gray-900 text-[14px]">
        Live matches not available
      </p>
      <p className="text-gray-400 text-[12px] mt-2">
        Check back soon or view scheduled matches
      </p>
    </div>
  )
}

export function ResultsFallback() {
  return (
    <div className="card p-6 text-center">
      <p className="text-2xl mb-2">✓</p>
      <p className="font-bold text-gray-900 text-[14px]">Results loading</p>
      <p className="text-gray-400 text-[12px] mt-2">
        Showing previous results
      </p>
    </div>
  )
}

export function FixturesFallback() {
  return (
    <div className="card p-6 text-center">
      <p className="text-2xl mb-2">📅</p>
      <p className="font-bold text-gray-900 text-[14px]">Schedule loading</p>
      <p className="text-gray-400 text-[12px] mt-2">
        We're fetching the latest matches
      </p>
    </div>
  )
}

export function SkeletonLoader({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="card h-20 animate-pulse bg-gray-100" />
      ))}
    </div>
  )
}
