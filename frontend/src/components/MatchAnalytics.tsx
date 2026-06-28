'use client'

import { useMemo } from 'react'

interface MatchAnalyticsProps {
  match: any
  stats: any[]
  pbp: any[]
}

function getStat(stats: any[], playerKey: number, name: string): string | null {
  const stat = stats.find(s => s.player_key === playerKey && s.stat_name === name && s.stat_period === 'match')
  return stat?.stat_value || null
}

export function MomentumGraph({ match, pbp }: { match: any; pbp: any[] }) {
  const momentum = useMemo(() => {
    if (!pbp.length) return []
    const p1Key = match?.player1_key
    const windows: any[] = []
    const windowSize = Math.max(1, Math.floor(pbp.length / 10))

    for (let i = 0; i < pbp.length; i += windowSize) {
      const window = pbp.slice(i, i + windowSize)
      const p1Wins = window.filter(p => p.point_winner === 'First Player' || p.point_winner === '1').length
      const p2Wins = window.length - p1Wins
      windows.push({ p1: p1Wins, p2: p2Wins, pct: Math.round(p1Wins / window.length * 100) })
    }
    return windows
  }, [pbp, match])

  if (!momentum.length) return null

  return (
    <div className="card p-4 mb-5">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Momentum</p>
      <div className="space-y-3">
        <div className="flex gap-2 items-end h-32">
          {momentum.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="w-full h-24 flex items-end justify-center gap-0.5">
                <div className="flex-1 h-full rounded-t bg-gradient-to-b from-green-500 to-green-400 opacity-80" style={{ height: `${m.pct}%` }} />
                <div className="flex-1 h-full rounded-t bg-gradient-to-b from-red-400 to-red-300 opacity-80" style={{ height: `${100 - m.pct}%` }} />
              </div>
              <p className="text-[9px] text-gray-400 mt-1 font-bold">{m.pct}%</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-500 text-center">Player 1 dominance across match progression</p>
      </div>
    </div>
  )
}

export function WinProbability({ match, stats, pbp }: { match: any; stats: any[]; pbp: any[] }) {
  const p1Key = match?.player1_key
  const p2Key = match?.player2_key

  const winProb = useMemo(() => {
    const p1PointsWon = parseInt(getStat(stats, p1Key, 'Total Points Won') || '0')
    const p2PointsWon = parseInt(getStat(stats, p2Key, 'Total Points Won') || '0')
    const total = p1PointsWon + p2PointsWon || 1
    return {
      p1: Math.round(p1PointsWon / total * 100),
      p2: Math.round(p2PointsWon / total * 100),
    }
  }, [stats, p1Key, p2Key])

  return (
    <div className="card p-4 mb-5">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Match Statistics</p>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-bold text-gray-900">{match.player1}</span>
            <span className="text-sm font-bold text-gray-900">{winProb.p1}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full" style={{ width: `${winProb.p1}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-bold text-gray-900">{match.player2}</span>
            <span className="text-sm font-bold text-gray-900">{winProb.p2}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-400 to-red-300 rounded-full" style={{ width: `${winProb.p2}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ShotStats({ match, stats }: { match: any; stats: any[] }) {
  const p1Key = match?.player1_key
  const p2Key = match?.player2_key

  const shotMetrics = [
    { name: 'Winners', key: 'Winners', icon: '⚡' },
    { name: 'Unforced Errors', key: 'Unforced Errors', icon: '❌' },
    { name: 'Break Points', key: 'Break Points Converted', icon: '🎯' },
  ]

  return (
    <div className="card p-4 mb-5">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Shot Stats</p>
      <div className="space-y-3">
        {shotMetrics.map(metric => {
          const v1 = getStat(stats, p1Key, metric.key) || '0'
          const v2 = getStat(stats, p2Key, metric.key) || '0'
          if (v1 === '0' && v2 === '0') return null
          const p1Val = parseInt(v1)
          const p2Val = parseInt(v2)
          const total = p1Val + p2Val || 1
          const pctP1 = Math.round(p1Val / total * 100)

          return (
            <div key={metric.key}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold text-gray-900">{metric.icon} {metric.name}</span>
                <span className="text-[11px] font-bold text-gray-400">{v1} vs {v2}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400" style={{ width: `${pctP1}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ServeStats({ match, stats }: { match: any; stats: any[] }) {
  const p1Key = match?.player1_key
  const p2Key = match?.player2_key

  const serveMetrics = [
    { name: '1st Serve %', key: '1st serve percentage', unit: '%' },
    { name: 'Aces', key: 'Aces', unit: '' },
    { name: 'Double Faults', key: 'Double Faults', unit: '' },
  ]

  return (
    <div className="card p-4 mb-5">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Serve Stats</p>
      <div className="grid grid-cols-3 gap-3">
        {serveMetrics.map(metric => {
          const v1 = getStat(stats, p1Key, metric.key)
          const v2 = getStat(stats, p2Key, metric.key)
          if (!v1 && !v2) return null

          return (
            <div key={metric.key} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-gray-400 font-semibold mb-2">{metric.name}</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-lg font-black text-gray-900">{v1}</span>
                <span className="text-xs text-gray-400">/</span>
                <span className="text-lg font-black text-gray-400">{v2}</span>
              </div>
              {metric.unit && <p className="text-[9px] text-gray-400 mt-1">{metric.unit}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function MatchAnalytics({ match, stats, pbp }: MatchAnalyticsProps) {
  return (
    <>
      <MomentumGraph match={match} pbp={pbp} />
      <WinProbability match={match} stats={stats} pbp={pbp} />
      <ShotStats match={match} stats={stats} />
      <ServeStats match={match} stats={stats} />
    </>
  )
}
