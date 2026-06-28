import type { Match } from '@/types'

const TOP_SEEDS = [
  'Jannik Sinner', 'Carlos Alcaraz', 'Novak Djokovic',
  'Daniil Medvedev', 'Dominic Thiem', 'Holger Rune',
  'Alexander Zverev', 'Matteo Berrettini',
  'Iga Swiatek', 'Aryna Sabalenka', 'Elena Rybakina',
  'Marketa Vondrousova', 'Madison Keys', 'Jasmine Paolini',
  'Jessica Pegula', 'Karolina Muchova',
]

const QUALIFIER_KEYWORDS = ['Q1', 'Q2', 'Q3', 'qualif', 'qualifier']

function isQualifier(playerName: string): boolean {
  const lower = playerName.toLowerCase()
  return QUALIFIER_KEYWORDS.some(k => lower.includes(k))
}

function getPlayerSeedRank(playerName: string): number {
  const idx = TOP_SEEDS.findIndex(s => playerName.toLowerCase().includes(s.toLowerCase()))
  return idx === -1 ? 999 : idx
}

function isBigMatch(match: Match): number {
  const p1Seed = getPlayerSeedRank(match.player1)
  const p2Seed = getPlayerSeedRank(match.player2)
  const bothSeeded = p1Seed < 50 && p2Seed < 50 ? 1 : 0
  const eitherTop3 = (p1Seed <= 2 || p2Seed <= 2) ? 1 : 0
  return eitherTop3 * 100 + bothSeeded * 10 + (50 - Math.min(p1Seed, p2Seed))
}

export function sortWimbledonMatches(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    // Main draw before qualifiers
    const aQualifier = isQualifier(a.player1) || isQualifier(a.player2)
    const bQualifier = isQualifier(b.player1) || isQualifier(b.player2)
    if (aQualifier !== bQualifier) return aQualifier ? 1 : -1

    // Higher seeded players first
    const aBigness = isBigMatch(a)
    const bBigness = isBigMatch(b)
    if (aBigness !== bBigness) return bBigness - aBigness

    // Fall back to original order
    return 0
  })
}
