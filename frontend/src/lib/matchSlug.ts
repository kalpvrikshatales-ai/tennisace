import type { Match } from '@/types'

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function playerLastName(name: string): string {
  if (!name) return 'unknown'
  const parts = name.trim().split(/\s+/)
  return parts[parts.length - 1]
}

export function matchToSlug(match: Match): string {
  const p1 = toSlug(playerLastName(match.player1))
  const p2 = toSlug(playerLastName(match.player2))
  const tournament = toSlug(match.tournament || 'unknown')
  const rawDate = (match as any).date as string | undefined
  const year = rawDate?.substring(0, 4) || new Date().getFullYear().toString()
  return `${p1}-vs-${p2}-${tournament}-${year}`
}

export function parseMatchSlug(slug: string): {
  p1Slug: string
  p2Slug: string
  tournamentSlug: string
  year: string
} {
  const vsSplit = slug.split('-vs-')
  const p1Slug = vsSplit[0] || ''
  // Rejoin in case tournament name contains "vs"
  const rightPart = vsSplit.slice(1).join('-vs-')
  const parts = rightPart.split('-')

  const lastPart = parts[parts.length - 1]
  const hasYear = /^\d{4}$/.test(lastPart)
  const year = hasYear ? lastPart : new Date().getFullYear().toString()

  const remaining = hasYear ? parts.slice(0, -1) : parts
  const p2Slug = remaining[0] || ''
  const tournamentSlug = remaining.slice(1).join('-')

  return { p1Slug, p2Slug, tournamentSlug, year }
}
