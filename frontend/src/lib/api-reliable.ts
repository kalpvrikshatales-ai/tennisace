/**
 * Production-grade API module with:
 * - Automatic retries with exponential backoff
 * - Request timeouts
 * - Response validation
 * - Persistent caching with TTL
 * - Error logging
 * - Fallback values
 */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Configuration
const CONFIG = {
  TIMEOUT_MS: 8000, // 8 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes
  CACHE_KEY_PREFIX: 'ta_cache_',
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  error?: string
}

/**
 * Generic fetch with timeout, retry, caching, and error handling
 */
async function fetchWithReliability<T>(
  endpoint: string,
  fallback: T,
  options?: {
    timeout?: number
    retries?: number
    cacheKey?: string
    skipCache?: boolean
  }
): Promise<T> {
  const timeout = options?.timeout ?? CONFIG.TIMEOUT_MS
  const maxRetries = options?.retries ?? CONFIG.RETRY_ATTEMPTS
  const cacheKey = options?.cacheKey ? `${CONFIG.CACHE_KEY_PREFIX}${options.cacheKey}` : null

  // Try to get from cache first
  if (cacheKey && !options?.skipCache) {
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const entry: CacheEntry<T> = JSON.parse(cached)
        const isExpired = Date.now() - entry.timestamp > CONFIG.CACHE_TTL_MS
        if (!isExpired && entry.data) {
          return entry.data
        }
      }
    } catch (e) {
      // Ignore cache read errors
    }
  }

  let lastError: Error | null = null

  // Retry loop with exponential backoff
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(`${API}${endpoint}`, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Check HTTP status
      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${response.statusText} at ${endpoint}`
        )
      }

      // Parse JSON
      const data = await response.json()

      // Validate data structure
      if (!data) {
        throw new Error(`Empty response from ${endpoint}`)
      }

      // Cache successful response
      if (cacheKey) {
        try {
          const cacheEntry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
          }
          localStorage.setItem(cacheKey, JSON.stringify(cacheEntry))
        } catch (e) {
          // Ignore cache write errors
        }
      }

      return data

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on abort (timeout)
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error(
          `[API] Timeout on attempt ${attempt + 1}/${maxRetries}: ${endpoint}`,
          lastError.message
        )
        // Continue to next retry
      } else {
        console.error(
          `[API] Error on attempt ${attempt + 1}/${maxRetries}: ${endpoint}`,
          lastError.message
        )
      }

      // Exponential backoff before next retry
      if (attempt < maxRetries - 1) {
        const delay = CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // All retries exhausted - try stale cache as last resort
  if (cacheKey) {
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const entry: CacheEntry<T> = JSON.parse(cached)
        console.warn(`[API] Using stale cache for ${endpoint} after ${maxRetries} failed attempts`)
        return entry.data
      }
    } catch (e) {
      // Ignore
    }
  }

  // Final fallback
  console.error(
    `[API] All retries failed for ${endpoint}. Returning fallback.`,
    lastError?.message
  )

  return fallback
}

// ═══ Exported API functions with fallbacks ═══

export const getLiveMatches = () =>
  fetchWithReliability(
    '/matches/live',
    { matches: [] },
    { cacheKey: 'live_matches' }
  )

export const getTournaments = () =>
  fetchWithReliability(
    '/tournaments/',
    { tournaments: [] },
    { cacheKey: 'tournaments' }
  )

export const getRankings = (type: 'ATP' | 'WTA') =>
  fetchWithReliability(
    `/players/rankings?type=${type}&limit=100`,
    { rankings: [] },
    { cacheKey: `rankings_${type}` }
  )

export const getResults = (days = 7) =>
  fetchWithReliability(
    `/feed/results?days=${days}`,
    { results: [] },
    { cacheKey: `results_${days}d` }
  )

export const getFixtures = (days = 7) =>
  fetchWithReliability(
    `/feed/fixtures?days=${days}`,
    { fixtures: [] },
    { cacheKey: `fixtures_${days}d` }
  )

export const getPlayer = (key: string) =>
  fetchWithReliability(
    `/players/${key}`,
    { name: 'Player', country: 'Unknown' },
    { cacheKey: `player_${key}` }
  )

export const getH2H = (k1: string, k2: string) =>
  fetchWithReliability(
    `/players/${k1}/h2h/${k2}`,
    { h2h: [] },
    { cacheKey: `h2h_${k1}_${k2}` }
  )

export const getAitaRankings = () =>
  fetchWithReliability(
    '/players/aita-rankings',
    { rankings: [] },
    { cacheKey: 'rankings_AITA' }
  )

// Utility: Clear all caches (for testing/debugging)
export const clearAllCaches = () => {
  try {
    const keys = Object.keys(localStorage).filter(k =>
      k.startsWith(CONFIG.CACHE_KEY_PREFIX)
    )
    keys.forEach(k => localStorage.removeItem(k))
    console.log(`[API] Cleared ${keys.length} cache entries`)
  } catch (e) {
    console.error('[API] Failed to clear caches:', e)
  }
}

// Utility: Get cache stats (for debugging)
export const getCacheStats = () => {
  const stats: Record<string, { age: number; entries: number }> = {}
  try {
    const keys = Object.keys(localStorage).filter(k =>
      k.startsWith(CONFIG.CACHE_KEY_PREFIX)
    )
    keys.forEach(k => {
      const cached = localStorage.getItem(k)
      if (cached) {
        try {
          const entry: CacheEntry<any> = JSON.parse(cached)
          const age = Date.now() - entry.timestamp
          const name = k.replace(CONFIG.CACHE_KEY_PREFIX, '')
          stats[name] = {
            age,
            entries: Array.isArray(entry.data)
              ? entry.data.length
              : entry.data ? 1 : 0,
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    })
  } catch (e) {
    console.error('[API] Failed to get cache stats:', e)
  }
  return stats
}
