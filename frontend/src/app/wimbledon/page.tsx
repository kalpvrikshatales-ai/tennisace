'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getPlayer, getH2H } from '@/lib/api'
import { getFlag } from '@/lib/flags'

const WIMBLEDON_START = new Date('2026-06-29T10:00:00Z')

const SEEDS = [
  { key: 2072,  name: 'Jannik Sinner',        country: 'Italy',     seed: 1 },
  { key: 2382,  name: 'Carlos Alcaraz',        country: 'Spain',     seed: 2 },
  { key: 1980,  name: 'Alexander Zverev',      country: 'Germany',   seed: 3 },
  { key: 2073,  name: 'Felix Auger-Aliassime', country: 'Canada',    seed: 4 },
  { key: 2973,  name: 'Ben Shelton',           country: 'USA',       seed: 5 },
  { key: 1106,  name: 'Alex De Minaur',        country: 'Australia', seed: 6 },
  { key: 2832,  name: 'Taylor Fritz',          country: 'USA',       seed: 7 },
  { key: 1905,  name: 'Novak Djokovic',        country: 'Serbia',    seed: 8 },
]

function Countdown() {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    const tick = () => {
      const diff = WIMBLEDON_START.getTime() - Date.now()
      if (diff <= 0) return
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const Box = ({ v, l }: { v: number; l: string }) => (
    <div className="flex flex-col items-center">
      <div className="glass rounded-xl px-4 py-3 min-w-[56px] text-center glow-green">
        <span className="text-3xl font-black text-gray-900 tabular-nums">{String(v).padStart(2,'0')}</span>
      </div>
      <span className="text-[10px] text-gray-900/40 uppercase tracking-widest mt-1">{l}</span>
    </div>
  )

  return (
    <div className="flex gap-3 justify-center">
      <Box v={t.d} l="days" />
      <span className="text-2xl text-[#00C875]/50 font-bold self-center pb-4">:</span>
      <Box v={t.h} l="hours" />
      <span className="text-2xl text-[#00C875]/50 font-bold self-center pb-4">:</span>
      <Box v={t.m} l="min" />
      <span className="text-2xl text-[#00C875]/50 font-bold self-center pb-4">:</span>
      <Box v={t.s} l="sec" />
    </div>
  )
}

function SeedCard({ s }: { s: typeof SEEDS[0] }) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    getPlayer(String(s.key)).then(setData).catch(() => {})
  }, [s.key])

  const getGrassStats = () => {
    const stats = (data?.stats ?? [])
      .filter((x: any) => x.type === 'singles' && x.grass_won)
      .sort((a: any, b: any) => parseInt(b.season) - parseInt(a.season))
      .slice(0, 3)
    return stats
  }

  const grass = getGrassStats()
  const grassWins = grass.reduce((a: number, s: any) => a + parseInt(s.grass_won || '0'), 0)
  const grassLoss = grass.reduce((a: number, s: any) => a + parseInt(s.grass_lost || '0'), 0)
  const grassPct = grassWins + grassLoss > 0 ? Math.round(grassWins / (grassWins + grassLoss) * 100) : 0

  return (
    <Link href={`/players/${s.key}`}>
      <div className="glass rounded-2xl p-4 hover:border-[#00C875]/30 border border-gray-200 transition-all card-glow cursor-pointer">
        <div className="flex items-center gap-3 mb-3">
          {data?.player_logo && (
            <img src={data.player_logo} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-[#00C875]/20" onError={e => e.currentTarget.style.display='none'} />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#00C875] font-black text-sm">#{s.seed}</span>
              <span className="text-gray-900 font-bold text-sm">{s.name.split(' ').pop()}</span>
            </div>
            <p className="text-[11px] text-gray-900/40">{getFlag(s.country)} {s.country}</p>
          </div>
        </div>
        {grass.length > 0 && (
          <div>
            <div className="flex justify-between text-[10px] text-gray-900/30 mb-1">
              <span>Grass (last 3 seasons)</span>
              <span className={`font-bold ${grassPct >= 75 ? 'text-[#00C875]' : grassPct >= 50 ? 'text-gray-900' : 'text-red-400'}`}>{grassPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00C875] to-[#00a862] rounded-full" style={{ width: `${grassPct}%` }} />
            </div>
            <div className="flex gap-3 mt-1">
              {grass.map((g: any) => (
                <span key={g.season} className="text-[10px] text-gray-900/25">{g.season}: {g.grass_won}-{g.grass_lost}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}

function PredictionVote() {
  const [vote, setVote] = useState<number | null>(null)
  const [votes, setVotes] = useState<Record<number, number>>({})

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('wimbledon_vote') ?? '{}')
      if (saved.vote) setVote(saved.vote)
      if (saved.votes) setVotes(saved.votes)
    } catch {}
  }, [])

  const cast = (key: number) => {
    const newVotes = { ...votes, [key]: (votes[key] ?? Math.floor(Math.random() * 800 + 200)) + 1 }
    setVote(key)
    setVotes(newVotes)
    localStorage.setItem('wimbledon_vote', JSON.stringify({ vote: key, votes: newVotes }))
  }

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="glass rounded-2xl p-5 mb-5">
      <p className="text-[11px] text-gray-900/30 uppercase tracking-widest mb-1">Fan Prediction</p>
      <p className="text-base font-bold text-gray-900 mb-4">Who wins Wimbledon 2026? 🏆</p>
      <div className="space-y-2">
        {SEEDS.slice(0, 6).map(s => {
          const v = votes[s.key] ?? 0
          const pct = vote ? Math.round((v / totalVotes) * 100) : 0
          return (
            <button
              key={s.key}
              onClick={() => !vote && cast(s.key)}
              className={`w-full text-left rounded-xl overflow-hidden relative transition-all ${
                vote ? 'cursor-default' : 'hover:border-[#00C875]/30 cursor-pointer'
              } border ${vote === s.key ? 'border-[#00C875]/50' : 'border-gray-200'}`}
            >
              {vote && (
                <div
                  className={`absolute inset-y-0 left-0 ${vote === s.key ? 'bg-[#00C875]/20' : 'bg-white/[0.04]'} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  {vote === s.key && <span className="text-[#00C875] text-sm">✓</span>}
                  <span className="text-sm font-semibold text-gray-900">{getFlag(s.country)} {s.name}</span>
                  <span className="text-[11px] text-gray-900/30">#{s.seed}</span>
                </div>
                {vote && <span className="text-xs font-bold text-gray-900/60">{pct}%</span>}
              </div>
            </button>
          )
        })}
      </div>
      {!vote && <p className="text-center text-[11px] text-gray-900/25 mt-3">Tap to cast your vote</p>}
      {vote && <p className="text-center text-[11px] text-gray-900/25 mt-3">{totalVotes.toLocaleString()} votes cast</p>}
    </div>
  )
}

export default function WimbledonPage() {
  const router = useRouter()
  const [h2h, setH2h] = useState<any[]>([])

  useEffect(() => {
    getH2H('2072', '2382').then(d => setH2h(d.H2H ?? [])).catch(() => {})
  }, [])

  const sinnerWins = h2h.filter(m => m.event_winner === 'First Player').length
  const alcarazWins = h2h.filter(m => m.event_winner === 'Second Player').length

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-900/40 hover:text-gray-900 text-sm">← Back</button>
          <div className="h-4 w-px bg-white/10" />
          <h1 className="text-xl font-bold">Tennis<span className="text-[#00C875]">Ace</span></h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">🌿</span>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Wimbledon 2026</h2>
          </div>
          <p className="text-gray-900/40 text-sm mb-2">The Championships · All England Club · SW19</p>
          <p className="text-[#00C875] text-xs font-semibold mb-6">Jun 30 – Jul 13 · Grass</p>
          <Countdown />
        </div>

        {/* Prediction vote */}
        <PredictionVote />

        {/* Sinner vs Alcaraz H2H */}
        {h2h.length > 0 && (
          <div className="glass rounded-2xl p-5 mb-5">
            <p className="text-[11px] text-gray-900/30 uppercase tracking-widest mb-3">Final Preview — H2H</p>
            <div className="flex items-center justify-between mb-4">
              <div className="text-center flex-1">
                <p className="text-lg font-black text-gray-900">Sinner</p>
                <p className="text-[11px] text-gray-900/40">🇮🇹 #1 seed</p>
              </div>
              <div className="text-center px-4">
                <p className="text-3xl font-black">
                  <span className="text-[#00C875]">{sinnerWins}</span>
                  <span className="text-gray-900/20 mx-2">–</span>
                  <span className="text-gray-900/60">{alcarazWins}</span>
                </p>
                <p className="text-[10px] text-gray-900/30 mt-1">{h2h.length} matches</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-lg font-black text-gray-900">Alcaraz</p>
                <p className="text-[11px] text-gray-900/40">🇪🇸 #2 seed</p>
              </div>
            </div>
            <div className="space-y-2">
              {h2h.slice(0, 3).map((m: any, i: number) => {
                const sinnerWon = m.event_winner === 'First Player' && m.first_player_key === 2072
                const alcarazWon = !sinnerWon
                return (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-200 last:border-0">
                    <span className={sinnerWon ? 'text-[#00C875] font-bold' : 'text-gray-900/40'}>{m.event_first_player}</span>
                    <span className="text-gray-900/25 text-[10px]">{m.tournament_name} {m.tournament_season}</span>
                    <span className={alcarazWon ? 'text-[#00C875] font-bold' : 'text-gray-900/40'}>{m.event_second_player}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top 8 seeds with grass stats */}
        <p className="text-[11px] text-gray-900/30 uppercase tracking-widest mb-3">Top 8 Seeds</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {SEEDS.map(s => <SeedCard key={s.key} s={s} />)}
        </div>

        <Link href="/compare" className="block glass rounded-2xl p-4 text-center border border-[#00C875]/20 hover:border-[#00C875]/40 transition-colors">
          <span className="text-[#00C875] font-bold text-sm">⚔️ Compare any two players →</span>
        </Link>
      </main>
    </div>
  )
}
