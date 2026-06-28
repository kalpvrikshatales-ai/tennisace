'use client'

import { useState } from 'react'

export function PlayStyleSection({ player }: { player: any }) {
  const playStyle = player?.play_style || 'All-Court Player'
  const styleEmoji: Record<string, string> = {
    'aggressive baseliner': '💪',
    'serve-volley': '🎯',
    'all-court': '🌍',
    'defensive': '🛡️',
    'hard court specialist': '🔵',
    'clay court specialist': '🏺',
    'grass court specialist': '🌿',
  }

  const emoji = styleEmoji[playStyle.toLowerCase()] || '🎾'

  return (
    <div className="card p-4">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Play Style</p>
      <div className="flex items-center gap-3">
        <div className="text-3xl">{emoji}</div>
        <div>
          <p className="text-[15px] font-black text-gray-900">{playStyle}</p>
          <p className="text-[11px] text-gray-500 mt-1">Signature playing approach</p>
        </div>
      </div>
    </div>
  )
}

export function StrengthsWeaknesses({ player }: { player: any }) {
  const strengths = player?.strengths || ['Powerful serve', 'Forehand drive', 'Court positioning']
  const weaknesses = player?.weaknesses || ['Backhand slice', 'Net approach']

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Strengths */}
      <div className="card p-4">
        <p className="text-[11px] font-bold text-green-600 uppercase tracking-wider mb-3">💪 Strengths</p>
        <div className="space-y-2">
          {(Array.isArray(strengths) ? strengths : [strengths]).map((s: any, i: number) => (
            <div key={i} className="text-[12px] font-semibold text-gray-900 flex items-start gap-2">
              <span className="text-green-500 flex-shrink-0">✓</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weaknesses */}
      <div className="card p-4">
        <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-3">⚠️ Weaknesses</p>
        <div className="space-y-2">
          {(Array.isArray(weaknesses) ? weaknesses : [weaknesses]).map((w: any, i: number) => (
            <div key={i} className="text-[12px] font-semibold text-gray-900 flex items-start gap-2">
              <span className="text-amber-500 flex-shrink-0">→</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function FavoriteSurface({ player }: { player: any }) {
  const surfaceEmoji: Record<string, string> = {
    grass: '🌿',
    clay: '🏺',
    hard: '🔵',
  }

  const favSurface = player?.favorite_surface?.toLowerCase() || 'Hard'
  const emoji = surfaceEmoji[favSurface] || '🔵'

  return (
    <div className="card p-4">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Favorite Surface</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{emoji}</div>
          <div>
            <p className="text-[15px] font-black text-gray-900">{favSurface} Court</p>
            <p className="text-[11px] text-gray-500 mt-1">Best performance</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TitlesByService({ player }: { player: any }) {
  const titlesByService = player?.titles_by_surface || {
    grass: 5,
    clay: 12,
    hard: 18,
  }

  return (
    <div className="card p-4">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Titles by Surface</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-[22px] font-black text-blue-500">{titlesByService.hard || 0}</p>
          <p className="text-[11px] text-gray-400 mt-1">🔵 Hard</p>
        </div>
        <div className="text-center">
          <p className="text-[22px] font-black text-amber-500">{titlesByService.clay || 0}</p>
          <p className="text-[11px] text-gray-400 mt-1">🏺 Clay</p>
        </div>
        <div className="text-center">
          <p className="text-[22px] font-black text-green-500">{titlesByService.grass || 0}</p>
          <p className="text-[11px] text-gray-400 mt-1">🌿 Grass</p>
        </div>
      </div>
    </div>
  )
}

export function RecentFormGraph({ player }: { player: any }) {
  const recentMatches = player?.recent_matches?.slice(0, 10) || []

  if (!recentMatches.length) {
    return (
      <div className="card p-4 text-center text-gray-500">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Form (Last 10)</p>
        <p className="text-sm">No recent matches</p>
      </div>
    )
  }

  return (
    <div className="card p-4">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Recent Form (Last 10)</p>
      <div className="flex items-end gap-1.5">
        {recentMatches.map((m: any, i: number) => {
          const isPlayer1 = m.player1_key === parseInt(player.player_key || 0)
          const won = (m.winner === 'First Player' && isPlayer1) || (m.winner === 'Second Player' && !isPlayer1)
          return (
            <div
              key={i}
              className="flex-1 h-12 rounded-lg transition-all hover:scale-105 flex items-end justify-center"
              style={{ background: won ? '#10b981' : '#ef4444' }}
              title={`${won ? 'Won' : 'Lost'} vs ${isPlayer1 ? m.player2 : m.player1}`}
            >
              <span className="text-[10px] font-bold text-white">{won ? 'W' : 'L'}</span>
            </div>
          )
        })}
      </div>
      <p className="text-[10px] text-gray-400 mt-3 text-center">
        {recentMatches.filter((m: any) => {
          const isPlayer1 = m.player1_key === parseInt(player.player_key || 0)
          return (m.winner === 'First Player' && isPlayer1) || (m.winner === 'Second Player' && !isPlayer1)
        }).length}/{recentMatches.length} wins
      </p>
    </div>
  )
}
