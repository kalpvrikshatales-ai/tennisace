'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Result {
  player_key: number
  player: string
  country: string
  place?: string
  league?: string
}

export default function SearchBar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timeout = setTimeout(async () => {
      setLoading(true)
      try {
        // Search across ATP + WTA rankings for matching names
        const [atp, wta] = await Promise.all([
          fetch(`${API}/players/rankings?type=ATP`).then(r => r.json()),
          fetch(`${API}/players/rankings?type=WTA`).then(r => r.json()),
        ])
        const all: Result[] = [...(atp.rankings ?? []), ...(wta.rankings ?? [])]
        const q = query.toLowerCase()
        setResults(all.filter(p => p.player.toLowerCase().includes(q)).slice(0, 8))
      } catch { }
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  const go = (key: number) => {
    router.push(`/players/${key}`)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors text-gray-500 hover:text-white text-sm"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <span className="hidden sm:inline">Search players</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl glass border border-gray-200 shadow-2xl z-50">
          <div className="p-3 border-b border-gray-200">
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search players..."
              className="w-full bg-transparent text-white placeholder-white/30 text-sm outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {loading && (
              <div className="py-4 text-center text-gray-400 text-sm">Searching...</div>
            )}
            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="py-4 text-center text-gray-400 text-sm">No players found</div>
            )}
            {results.map(r => (
              <button
                key={r.player_key}
                onClick={() => go(r.player_key)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{r.player}</p>
                  <p className="text-[11px] text-gray-500">{r.country}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#00C875] font-bold">{r.league}</span>
                  {r.place && <p className="text-[10px] text-gray-400">#{r.place}</p>}
                </div>
              </button>
            ))}
            {!query && (
              <div className="py-4 text-center text-gray-400 text-xs">
                Type a player name to search
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
