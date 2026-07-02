'use client'

import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'
const SESSION_KEY = '_ta_admin'

interface Stats {
  votes: {
    total: number
    unique_matches: number
    unique_browsers: number
    top_matches: { match_id: string; total: number; player1_votes: number; player2_votes: number }[]
  }
  app: { live_matches: number }
  error: string | null
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-gray-900">{value}</p>
      {sub && <p className="text-[12px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function AdminPage() {
  const [key, setKey] = useState('')
  const [inputKey, setInputKey] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Restore key from sessionStorage on load
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved) { setKey(saved); fetchStats(saved) }
  }, [])

  const fetchStats = async (k: string) => {
    setLoading(true)
    setError('')
    try {
      const r = await fetch(`${API}/admin/stats?key=${encodeURIComponent(k)}`)
      if (r.status === 401) { setError('Wrong key'); setKey(''); sessionStorage.removeItem(SESSION_KEY); return }
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = await r.json()
      setStats(data)
      setLastRefresh(new Date())
      setKey(k)
      sessionStorage.setItem(SESSION_KEY, k)
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputKey.trim()) fetchStats(inputKey.trim())
  }

  // Not authenticated
  if (!key) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="TennisAce" className="h-16 w-16 rounded-2xl object-cover mx-auto mb-3" />
            <h1 className="text-[22px] font-black text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">TennisAce — private access only</p>
          </div>
          <form onSubmit={handleLogin} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <label className="block text-[12px] font-bold text-gray-600 mb-2 uppercase tracking-wider">Admin Key</label>
            <input
              type="password"
              value={inputKey}
              onChange={e => setInputKey(e.target.value)}
              placeholder="Enter your admin key"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-semibold focus:outline-none focus:border-green-400 mb-3"
              autoFocus
            />
            {error && <p className="text-red-500 text-[12px] mb-3">{error}</p>}
            <button
              type="submit"
              disabled={loading || !inputKey.trim()}
              className="w-full py-3 rounded-xl text-[14px] font-black text-white transition-all"
              style={{ background: loading ? '#ccc' : '#00C875' }}
            >
              {loading ? 'Checking...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="TennisAce" className="h-7 w-7 rounded-xl object-cover flex-shrink-0" />
            <span className="text-[16px] font-black text-gray-900">Admin</span>
            <span className="text-[10px] font-bold text-white bg-green-500 px-2 py-0.5 rounded-full">PRIVATE</span>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <p className="text-[11px] text-gray-400 hidden sm:block">
                Updated {lastRefresh.toLocaleTimeString()}
              </p>
            )}
            <button
              onClick={() => fetchStats(key)}
              disabled={loading}
              className="text-[12px] font-bold text-green-600 hover:text-green-700 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 transition-all"
            >
              {loading ? 'Loading...' : '↻ Refresh'}
            </button>
            <button
              onClick={() => { setKey(''); sessionStorage.removeItem(SESSION_KEY); setStats(null) }}
              className="text-[12px] font-bold text-gray-400 hover:text-gray-600"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading && !stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 h-24 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <>
            {stats.error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-[13px] text-red-600">
                ⚠️ DB Error: {stats.error}
              </div>
            )}

            {/* Key metrics */}
            <section className="mb-8">
              <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-4">Voting Stats</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatCard
                  label="Total Votes"
                  value={stats.votes.total.toLocaleString()}
                  sub="All time"
                />
                <StatCard
                  label="Unique Voters"
                  value={stats.votes.unique_browsers.toLocaleString()}
                  sub="By browser ID"
                />
                <StatCard
                  label="Matches Voted"
                  value={stats.votes.unique_matches.toLocaleString()}
                  sub="Unique match cards"
                />
                <StatCard
                  label="Live Now"
                  value={stats.app.live_matches}
                  sub="Active matches"
                />
                <StatCard
                  label="Avg Votes/Match"
                  value={stats.votes.unique_matches > 0
                    ? (stats.votes.total / stats.votes.unique_matches).toFixed(1)
                    : '0'}
                  sub="Per match card"
                />
              </div>
            </section>

            {/* Top matches */}
            {stats.votes.top_matches.length > 0 && (
              <section className="mb-8">
                <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-4">Most Voted Matches</h2>
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  {stats.votes.top_matches.map((m, i) => {
                    const total = m.total || 1
                    const p1Pct = Math.round(m.player1_votes / total * 100)
                    const p2Pct = 100 - p1Pct
                    return (
                      <div key={m.match_id} className={`p-4 ${i < stats.votes.top_matches.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[12px] font-bold text-gray-900">Match #{m.match_id}</span>
                          <span className="text-[11px] font-bold text-green-600">{m.total} votes</span>
                        </div>
                        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                          <div className="bg-green-400 rounded-l-full" style={{ width: `${p1Pct}%` }} />
                          <div className="bg-red-400 rounded-r-full" style={{ width: `${p2Pct}%` }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-gray-400">P1: {m.player1_votes} ({p1Pct}%)</span>
                          <span className="text-[10px] text-gray-400">P2: {m.player2_votes} ({p2Pct}%)</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* No votes yet */}
            {stats.votes.total === 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                <p className="text-3xl mb-3">🗳️</p>
                <p className="font-bold text-gray-900">No votes yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  {stats.error ? 'Could not connect to Supabase' : 'Votes will appear here as users start voting'}
                </p>
              </div>
            )}

            <p className="text-center text-[11px] text-gray-300 mt-8">
              tennisace.live · admin · {new Date().toLocaleDateString()}
            </p>
          </>
        ) : null}
      </main>
    </div>
  )
}
