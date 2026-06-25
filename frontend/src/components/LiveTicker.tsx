'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getLiveMatches } from '@/lib/api'
import type { Match } from '@/types'

export default function LiveTicker() {
  const [matches, setMatches] = useState<Match[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const d = await getLiveMatches()
        setMatches((d.matches ?? []).filter((m: Match) =>
          m.status === 'In Progress' || m.status === '1'
        ))
      } catch {}
    }
    fetch()
    const t = setInterval(fetch, 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!scrollRef.current || matches.length < 2) return
    const el = scrollRef.current
    let pos = 0
    const speed = 0.5
    const animate = () => {
      pos += speed
      if (pos >= el.scrollWidth / 2) pos = 0
      el.scrollLeft = pos
    }
    const id = setInterval(animate, 16)
    return () => clearInterval(id)
  }, [matches])

  if (matches.length === 0) return null

  const items = [...matches, ...matches] // duplicate for seamless loop

  return (
    <div className="w-full overflow-hidden border-b border-[#00C875]/10 bg-[#00C875]/5">
      <div
        ref={scrollRef}
        className="flex gap-0 overflow-hidden whitespace-nowrap"
        style={{ userSelect: 'none' }}
      >
        {items.map((m, i) => (
          <Link
            key={`${m.match_id}-${i}`}
            href={`/matches/${m.match_id}`}
            className="inline-flex items-center gap-3 px-5 py-1.5 border-r border-white/[0.06] hover:bg-white/[0.04] transition-colors flex-shrink-0"
          >
            <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-[#00C875] flex-shrink-0" />
            <span className="text-[11px] text-white/50 font-medium">{m.tournament}</span>
            <span className="text-[12px] font-semibold text-white">
              {m.player1.split(' ').pop()} <span className="text-[#00C875] font-bold">{m.score?.split(',')[0]?.split('-')[0]}</span>
              <span className="text-white/30 mx-1">–</span>
              <span className="text-[#00C875] font-bold">{m.score?.split(',')[0]?.split('-')[1]}</span> {m.player2.split(' ').pop()}
            </span>
            {m.game_score && (
              <span className="text-[10px] text-white/30 font-mono">{m.game_score}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
