/**
 * Data Validation Layer
 * Ensures data integrity before display
 * Follows "Truth-First" principle: show nothing rather than wrong data
 */

import type { Match } from '@/types'

export interface ValidationResult<T> {
  valid: boolean
  data: T | null
  errors: string[]
  warning?: string
}

// Required fields for each data type
const REQUIRED_MATCH_FIELDS = ['match_id', 'player1', 'player2', 'tournament']
const REQUIRED_RANKING_FIELDS = ['player', 'player_key', 'place', 'league']
const REQUIRED_STAT_FIELDS = ['stat_name', 'stat_value']

/**
 * Validate a single match object
 */
export function validateMatch(match: any): ValidationResult<Match> {
  const errors: string[] = []

  if (!match) {
    return { valid: false, data: null, errors: ['Match is null or undefined'] }
  }

  // Check required fields
  for (const field of REQUIRED_MATCH_FIELDS) {
    if (!match[field] || match[field].toString().trim() === '') {
      errors.push(`Missing required field: ${field}`)
    }
  }

  // Validate player names (not just spaces)
  if (match.player1?.trim() === '' || match.player2?.trim() === '') {
    errors.push('Player names cannot be empty')
  }

  // Validate match ID format
  if (!match.match_id || typeof match.match_id !== 'string') {
    errors.push('Invalid match_id format')
  }

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? match : null,
    errors,
  }
}

/**
 * Validate array of matches
 */
export function validateMatches(matches: any[]): ValidationResult<Match[]> {
  const errors: string[] = []
  const validMatches: Match[] = []

  if (!Array.isArray(matches)) {
    return {
      valid: false,
      data: null,
      errors: ['Expected array of matches'],
    }
  }

  if (matches.length === 0) {
    return {
      valid: false,
      data: null,
      errors: ['Empty match list'],
    }
  }

  matches.forEach((match, idx) => {
    const validation = validateMatch(match)
    if (validation.valid && validation.data) {
      validMatches.push(validation.data)
    } else {
      errors.push(`Match ${idx}: ${validation.errors.join(', ')}`)
    }
  })

  // Return valid matches even if some were filtered
  // (e.g., API might return 20 items, we filter to 12 valid ones → show those 12)
  if (validMatches.length === 0) {
    return {
      valid: false,
      data: null,
      errors: ['No valid matches found after filtering'],
    }
  }

  return {
    valid: true,
    data: validMatches,
    errors: [],  // Clear errors since we have valid data
    warning: validMatches.length < matches.length
      ? `Filtered out ${matches.length - validMatches.length} items (may be doubles, bad data, etc.)`
      : undefined,
  }
}

/**
 * Validate ranking data
 */
export function validateRanking(ranking: any): boolean {
  if (!ranking) return false
  for (const field of REQUIRED_RANKING_FIELDS) {
    if (!ranking[field]) return false
  }
  if (!Number.isInteger(ranking.player_key)) return false
  if (isNaN(parseInt(ranking.place))) return false
  return true
}

/**
 * Validate rankings array
 */
export function validateRankings(rankings: any[]): ValidationResult<any[]> {
  const errors: string[] = []

  if (!Array.isArray(rankings)) {
    return {
      valid: false,
      data: null,
      errors: ['Expected array of rankings'],
    }
  }

  if (rankings.length === 0) {
    return {
      valid: false,
      data: null,
      errors: ['Empty rankings list'],
    }
  }

  const validRankings = rankings.filter(r => validateRanking(r))

  if (validRankings.length === 0) {
    return {
      valid: false,
      data: null,
      errors: ['No valid rankings found in dataset'],
    }
  }

  // Return valid rankings even if some were filtered
  return {
    valid: true,
    data: validRankings,
    errors: [],
    warning: validRankings.length < rankings.length
      ? `Filtered out ${rankings.length - validRankings.length} invalid entries`
      : undefined,
  }
}

/**
 * Validate match statistics consistency
 */
export function validateMatchStats(stats: any[]): ValidationResult<any[]> {
  const errors: string[] = []

  if (!Array.isArray(stats)) {
    return {
      valid: false,
      data: null,
      errors: ['Expected array of stats'],
    }
  }

  const validStats = stats.filter(stat => {
    // Check required fields
    if (!stat.stat_name || !stat.stat_value) return false

    // If stat has won/total, they should be consistent
    if (stat.stat_won !== null && stat.stat_total !== null) {
      const won = parseInt(stat.stat_won)
      const total = parseInt(stat.stat_total)
      // Won should never exceed total
      if (won > total) {
        errors.push(`Stat inconsistency: ${stat.stat_name} has won=${won} > total=${total}`)
        return false
      }
    }

    return true
  })

  if (validStats.length === 0) {
    return {
      valid: false,
      data: null,
      errors: ['No valid stats found'],
    }
  }

  return {
    valid: true,
    data: validStats,
    errors,
  }
}

/**
 * Check data freshness
 */
export function isDataFresh(timestamp: number, maxAgeMs: number = 5 * 60 * 1000): boolean {
  return Date.now() - timestamp < maxAgeMs
}

/**
 * Validate H2H data
 */
export function validateH2H(h2h: any): ValidationResult<any> {
  if (!h2h) {
    return {
      valid: false,
      data: null,
      errors: ['H2H data is empty'],
    }
  }

  if (!Array.isArray(h2h)) {
    return {
      valid: false,
      data: null,
      errors: ['H2H should be array'],
    }
  }

  // H2H being empty is OK - means first time meeting
  return {
    valid: true,
    data: h2h,
    errors: [],
  }
}
