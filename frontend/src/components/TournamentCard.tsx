import Link from 'next/link'
import type { Tournament } from '@/types'

interface Props {
  tournament: Tournament
}

const surfaceMeta: Record<string, { color: string; emoji: string }> = {
  Grass:  { color: '#4ade80', emoji: '🌿' },
  Clay:   { color: '#fb923c', emoji: '🏺' },
  Hard:   { color: '#60a5fa', emoji: '🔵' },
  Carpet: { color: '#c084fc', emoji: '🟣' },
}

export default function TournamentCard({ tournament }: Props) {
  const surface = surfaceMeta[tournament.surface] ?? { color: '#ffffff40', emoji: '🎾' }

  return (
    <Link href={`/tournaments/${tournament.id}`}>
      <div className="rounded-xl border border-white/[0.06] bg-[#0F2A4A] hover:border-[#00C875]/30 hover:bg-[#112547] transition-all duration-200 p-4 flex items-center justify-between gap-4 cursor-pointer">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{surface.emoji}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{tournament.name}</p>
            <p className="text-[11px] text-white/40 mt-0.5">{tournament.country}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full"
            style={{ color: surface.color, backgroundColor: `${surface.color}18` }}
          >
            {tournament.surface}
          </span>
          <span className="text-white/20 text-sm">›</span>
        </div>
      </div>
    </Link>
  )
}
