/**
 * Smart Match Priority Engine
 * Intelligently prioritizes matches based on:
 * 1. Grand Slam vs other tournaments
 * 2. Top seeded players
 * 3. Marquee matchups
 * 4. Match round/importance
 * 5. Live vs upcoming
 */

import type { Match } from '@/types'

// Elite player last names — matched against abbreviated API names like "J. Sinner"
// API returns "X. Lastname" format so we match on last name only
const ELITE_LAST_NAMES = new Set([
  'Sinner', 'Alcaraz', 'Djokovic', 'Medvedev', 'Zverev',
  'Rune', 'Berrettini', 'Fritz', 'Shelton', 'De Minaur',
  'Auger-Aliassime', 'Thiem', 'Dimitrov', 'Tsitsipas', 'Rublev',
  'Swiatek', 'Sabalenka', 'Rybakina', 'Vondrousova', 'Paolini',
  'Keys', 'Pegula', 'Muchova', 'Gauff', 'Zheng', 'Andreeva',
  'Badosa', 'Kvitova', 'Wozniacki', 'Osaka',
])

function isElitePlayer(name: string): boolean {
  if (!name) return false
  // Check full name match (e.g., "Jannik Sinner")
  // Check last name match (e.g., "J. Sinner" or "Sinner")
  const parts = name.trim().split(/\s+/)
  const lastName = parts[parts.length - 1]
  return ELITE_LAST_NAMES.has(lastName)
}

// Grand Slam tournaments
const GRAND_SLAMS = new Set([
  'Wimbledon', 'US Open', 'Australian Open', 'Roland Garros',
  'Wimbledon 2025', 'Wimbledon 2026', 'US Open 2025', 'US Open 2026',
  'Australian Open 2025', 'Australian Open 2026',
  'Roland Garros 2025', 'Roland Garros 2026',
])

// ATP Masters 1000
const MASTERS_1000 = new Set([
  'Monte Carlo', 'Madrid', 'Rome', 'Canada',
  'Cincinnati', 'Shanghai', 'Paris', 'Miami',
])

// Round importance
const ROUND_PRIORITY: Record<string, number> = {
  'Final': 100,
  'F': 100,
  'Semi-Final': 90,
  'SF': 90,
  '1/2-finals': 90,
  'Quarter-Final': 80,
  'QF': 80,
  '1/4-finals': 80,
  'R4': 70,
  '1/8-finals': 70,
  'R3': 60,
  '1/16-finals': 60,
  'R2': 50,
  '1/32-finals': 50,
  'R1': 40,
  '1/64-finals': 40,
}

// Match status priority (live matches first)
const STATUS_PRIORITY: Record<string, number> = {
  'In Progress': 1000,
  'live': 1000,
  '1': 1000,
}

interface MatchScore {
  priority: number
  isLive: boolean
  isGrandSlam: boolean
  eliteCount: number
  roundScore: number
}

/**
 * Calculate priority score for a match
 * Higher score = should appear first
 */
export function calculateMatchPriority(match: Match): MatchScore {
  let priority = 0
  let eliteCount = 0
  let roundScore = 0

  // 1. TOURNAMENT TIER (0-300 points)
  if (GRAND_SLAMS.has(match.tournament || '')) {
    priority += 300
  } else if (MASTERS_1000.has(match.tournament || '')) {
    priority += 200
  } else if ((match.tournament || '').includes('ATP') || (match.tournament || '').includes('WTA')) {
    priority += 150
  } else {
    priority += 50
  }

  // 2. ELITE PLAYER BONUS (0-200 points)
  // Use last-name matching since API returns abbreviated names like "J. Sinner"
  if (isElitePlayer(match.player1 || '')) eliteCount++
  if (isElitePlayer(match.player2 || '')) eliteCount++
  priority += eliteCount * 100 // 100, 200, or 0 points

  // 3. ROUND IMPORTANCE (0-100 points)
  roundScore = ROUND_PRIORITY[match.round || ''] || 0
  priority += roundScore

  // 4. LIVE STATUS (instant 500 boost)
  const isLive = match.status === 'In Progress' || match.status === 'live'
    || match.status === '1' || (match.status || '').startsWith('Set')

  if (isLive) {
    priority += 500
  }

  // 5. QUALIFIER PENALTY (-100 points)
  const isQualifier = (match.player1?.toLowerCase().includes('qual') || false) ||
                      (match.player2?.toLowerCase().includes('qual') || false)
  if (isQualifier) {
    priority -= 100
  }

  return {
    priority,
    isLive,
    isGrandSlam: GRAND_SLAMS.has(match.tournament || ''),
    eliteCount,
    roundScore,
  }
}

/**
 * Sort matches by priority
 * This is the definitive sort order for TennisAce
 */
export function sortByPriority(matches: Match[]): Match[] {
  if (!Array.isArray(matches) || matches.length === 0) {
    return matches
  }

  return [...matches].sort((a, b) => {
    const scoreA = calculateMatchPriority(a)
    const scoreB = calculateMatchPriority(b)

    // Primary: by priority score (descending)
    if (scoreA.priority !== scoreB.priority) {
      return scoreB.priority - scoreA.priority
    }

    // Secondary: live matches before scheduled
    if (scoreA.isLive !== scoreB.isLive) {
      return scoreA.isLive ? -1 : 1
    }

    // Tertiary: by date/time if available
    const dateA = (a as any).date
    const dateB = (b as any).date
    if (dateA && dateB) {
      const timeA = new Date(dateA).getTime()
      const timeB = new Date(dateB).getTime()
      if (timeA !== timeB) {
        return timeA - timeB
      }
    }

    // Quaternary: preserve original order
    return 0
  })
}

/**
 * Get a human-readable explanation of why a match was prioritized
 */
export function explainPriority(match: Match): string {
  const score = calculateMatchPriority(match)
  const reasons: string[] = []

  if (score.isLive) reasons.push('🔴 Live')
  if (score.isGrandSlam) reasons.push('🏆 Grand Slam')
  if (score.eliteCount === 2) reasons.push('⭐⭐ Elite matchup')
  if (score.eliteCount === 1) reasons.push('⭐ Elite player')
  if (score.roundScore >= 80) reasons.push('📊 Important round')

  return reasons.length > 0 ? reasons.join(' • ') : 'Regular match'
}

/**
 * Filter matches by criteria while preserving priority
 */
export function filterAndSortMatches(
  matches: Match[],
  options?: {
    excludeQualifiers?: boolean
    maxResults?: number
    minEliteCount?: number
  }
): Match[] {
  let filtered = matches

  // Filter out qualifiers if requested
  if (options?.excludeQualifiers) {
    filtered = filtered.filter(m =>
      !m.player1?.toLowerCase().includes('qual') &&
      !m.player2?.toLowerCase().includes('qual')
    )
  }

  // Filter by elite count if requested
  if (options?.minEliteCount !== undefined) {
    filtered = filtered.filter(m => {
      const score = calculateMatchPriority(m)
      return score.eliteCount >= options.minEliteCount!
    })
  }

  // Sort by priority
  const sorted = sortByPriority(filtered)

  // Limit results if requested
  if (options?.maxResults) {
    return sorted.slice(0, options.maxResults)
  }

  return sorted
}
