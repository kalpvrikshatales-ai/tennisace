import type { Match } from '@/types'

// Tournament importance scoring
const TOURNAMENT_SCORES: Record<string, number> = {
  // Grand Slams (highest priority)
  'Wimbledon': 1000,
  'US Open': 1000,
  'Roland Garros': 1000,
  'Australian Open': 1000,

  // Masters 1000
  'Cincinnati': 900,
  'Miami': 900,
  'Madrid': 900,
  'Rome': 900,
  'Shanghai': 900,
  'Paris': 900,
  'Monte Carlo': 900,
  'Canada': 900,
  'Cincinnati Masters': 900,
  'Miami Masters': 900,

  // ATP/WTA 500
  'Washington': 800,
  'Tokyo': 800,
  'Dubai': 800,
  'Halle': 800,
  'Queen\'s': 800,
  'Seoul': 800,
  'Beijing': 800,
  'Basel': 800,
  'Vienna': 800,
  'Stockholm': 800,

  // ATP/WTA 250
  'Auckland': 700,
  'Doha': 700,
  'Pune': 700,
  'Sofia': 700,
  'Delray Beach': 700,
  'Dubai Duty Free': 700,
  'Buenos Aires': 700,
  'Barcelona': 700,
  'Stuttgart': 700,
  'Nice': 700,
  'Eastbourne': 700,
  'Newport': 700,
  'Germany': 700,
  'Bastad': 700,
  'Umag': 700,
  'Gstaad': 700,
  'Los Cabos': 700,
  'Montreal': 700,

  // Challengers (lower priority)
  'Challenger': 500,
}

// Get tournament priority score
function getTournamentScore(tournament: string | undefined): number {
  if (!tournament) return 300 // Default for unknown tournaments

  // Check exact matches first
  if (TOURNAMENT_SCORES[tournament]) {
    return TOURNAMENT_SCORES[tournament]
  }

  // Check for partial matches
  for (const [key, score] of Object.entries(TOURNAMENT_SCORES)) {
    if (tournament.includes(key) || key.includes(tournament)) {
      return score
    }
  }

  // Default score for unrecognized tournaments
  return 400
}

// Get round priority (later rounds are higher priority)
function getRoundScore(round: string | undefined): number {
  if (!round) return 0

  const roundUpper = round.toUpperCase()

  // Qualifiers have lowest priority
  if (roundUpper.includes('QUALI')) return 1
  if (roundUpper.includes('Q')) return 1

  // First round
  if (roundUpper.includes('R1') || roundUpper === 'FIRST ROUND') return 2

  // Second round
  if (roundUpper.includes('R2') || roundUpper === 'SECOND ROUND') return 3

  // Third round
  if (roundUpper.includes('R3') || roundUpper === 'THIRD ROUND') return 4

  // Fourth round
  if (roundUpper.includes('R4') || roundUpper === 'FOURTH ROUND') return 5

  // Quarterfinals
  if (roundUpper.includes('QF') || roundUpper === 'QUARTERFINALS') return 6

  // Semifinals
  if (roundUpper.includes('SF') || roundUpper === 'SEMIFINALS') return 7

  // Finals
  if (roundUpper.includes('F') || roundUpper === 'FINAL') return 8

  return 2 // Default to early round
}

// Estimate player ranking from name/context
// Lower ranking number = higher ranked
function estimatePlayerRanking(playerName: string): number {
  const topPlayers: Record<string, number> = {
    'Jannik Sinner': 1,
    'Novak Djokovic': 2,
    'Carlos Alcaraz': 3,
    'Daniil Medvedev': 4,
    'Holger Rune': 5,
    'Stefanos Tsitsipas': 6,
    'Taylor Fritz': 7,
    'Alexander Zverev': 8,
    'Tommy Paul': 9,
    'Grigor Dimitrov': 10,
    'Iga Swiatek': 1,
    'Aryna Sabalenka': 2,
    'Coco Gauff': 3,
    'Emma Raducanu': 4,
    'Marketa Vondrousova': 5,
  }

  return topPlayers[playerName] || 100 // Default ranking for unknown players
}

// Calculate match priority score
function getMatchPriorityScore(match: any): number {
  let score = 0

  // 1. Tournament importance (0-1000)
  score += getTournamentScore(match.tournament || (match as any).tournament_name) * 10

  // 2. Round importance (0-8)
  score += getRoundScore(match.round || (match as any).round_raw) * 100

  // 3. Player rankings (higher ranked = higher priority)
  const p1Rank = estimatePlayerRanking(match.player1)
  const p2Rank = estimatePlayerRanking(match.player2)
  const rankScore = (200 - p1Rank) + (200 - p2Rank) // Both player rankings contribute
  score += Math.max(0, rankScore)

  return score
}

export function sortMatches(matches: any[]): any[] {
  return [...matches].sort((a, b) => {
    const scoreA = getMatchPriorityScore(a)
    const scoreB = getMatchPriorityScore(b)
    return scoreB - scoreA // Higher score first
  })
}

// Sort matches and also filter/group by importance
export function prioritizeMatches(matches: any[]): {
  topMatches: any[]
  otherMatches: any[]
} {
  const sorted = sortMatches(matches)

  // Top matches are: Grand Slams or high-ranked player matchups or later rounds
  const topMatches = sorted.filter(m => {
    const score = getMatchPriorityScore(m)
    const isGrandSlam = getTournamentScore(m.tournament) >= 1000
    const isLaterRound = getRoundScore(m.round) >= 4
    const isHighRanked = estimatePlayerRanking(m.player1) <= 20 || estimatePlayerRanking(m.player2) <= 20

    return isGrandSlam || isLaterRound || isHighRanked || score > 5000
  })

  const otherMatches = sorted.filter(m => !topMatches.includes(m))

  return { topMatches, otherMatches }
}
