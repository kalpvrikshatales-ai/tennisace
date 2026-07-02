'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface SearchResult {
  type: 'match' | 'tournament' | 'player'
  label: string
  sub?: string
  href: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  data: { matches: any[]; fixtures: any[]; results: any[] }
}

export default function SearchModal({ isOpen, onClose, data }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [isOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const q = query.toLowerCase().trim()
  const results: SearchResult[] = []

  if (q.length >= 2) {
    const allMatches = [...data.matches, ...data.fixtures, ...data.results]
    const seenTournaments = new Set<string>()
    const seenPlayers = new Set<string>()
    const seenMatches = new Set<string>()

    for (const m of allMatches) {
      // Tournament matches
      if (m.tournament?.toLowerCase().includes(q) && !seenTournaments.has(m.tournament)) {
        seenTournaments.add(m.tournament)
        results.push({ type: 'tournament', label: m.tournament, href: '/' })
      }

      // Player matches
      for (const [pname, pkey] of [[m.player1, m.player1_key], [m.player2, m.player2_key]] as [string, number | undefined][]) {
        if (pname?.toLowerCase().includes(q) && !seenPlayers.has(pname)) {
          seenPlayers.add(pname)
          results.push({
            type: 'player',
            label: pname,
            sub: m.tournament,
            href: pkey ? `/players/${pkey}` : '/',
          })
        }
      }

      // Vs match
      const vs = `${m.player1} ${m.player2}`.toLowerCase()
      if (vs.includes(q) && m.match_id && !seenMatches.has(m.match_id)) {
        seenMatches.add(m.match_id)
        results.push({
          type: 'match',
          label: `${m.player1} vs ${m.player2}`,
          sub: m.tournament,
          href: `/matches/${m.match_id}`,
        })
      }
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Search panel */}
      <div className="fixed top-0 left-0 right-0 z-50 shadow-xl">
        {/* Input row */}
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <svg className="text-gray-400 flex-shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Players, tournaments, matches…"
              className="flex-1 text-[15px] outline-none text-gray-900 placeholder-gray-400 bg-transparent"
              autoComplete="off"
            />
            <button
              onClick={onClose}
              className="text-[13px] font-semibold text-gray-500 hover:text-gray-900 flex-shrink-0 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Results */}
        {(results.length > 0 || (q.length >= 2 && results.length === 0)) && (
          <div className="bg-white border-b border-gray-100 max-h-[70vh] overflow-y-auto">
            <div className="max-w-3xl mx-auto py-2">
              {results.length === 0 ? (
                <p className="text-center text-[13px] text-gray-400 py-6">No results for "{query}"</p>
              ) : (
                results.slice(0, 20).map((r, i) => (
                  <Link key={i} href={r.href} onClick={onClose}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                    <span className={`text-[9px] font-black uppercase tracking-widest w-14 text-center py-1 rounded-full flex-shrink-0 ${
                      r.type === 'tournament'
                        ? 'bg-[#00C875]/15 text-[#00C875]'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {r.type}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-gray-900 truncate">{r.label}</p>
                      {r.sub && <p className="text-[11px] text-gray-400 truncate">{r.sub}</p>}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
