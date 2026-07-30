'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getPlayer, getH2H } from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const GREEN = '#22C55E'

export default function WimbledonMatchDetail({ params }: { params: { 'match-id': string } }) {
  const router = useRouter()
  const [match, setMatch] = useState<any>(null)
  const [player1Data, setPlayer1Data] = useState<any>(null)
  const [player2Data, setPlayer2Data] = useState<any>(null)
  const [h2h, setH2h] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        // Fetch match data from API
        const res = await fetch(`${API}/matches/${params['match-id']}`)
        const data = await res.json()
        setMatch(data.match || data)

        if (data.match?.player1_key && data.match?.player2_key) {
          // Fetch player data
          const [p1, p2, h2hData] = await Promise.all([
            getPlayer(String(data.match.player1_key)),
            getPlayer(String(data.match.player2_key)),
            getH2H(String(data.match.player1_key), String(data.match.player2_key)).catch(() => ({})),
          ])
          setPlayer1Data(p1)
          setPlayer2Data(p2)
          setH2h(h2hData)
        }
      } catch (e) {
        console.error('Error fetching match data:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchMatchData()
  }, [params])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading match details...</div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900 font-bold mb-4">Match not found</p>
          <button
            onClick={() => router.back()}
            className="text-green-600 font-semibold hover:text-green-700"
            style={{ color: GREEN }}
          >
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <span className="text-[14px] font-bold text-gray-900">Wimbledon 2026</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Match Card */}
        <div className="card p-6 mb-6">
          <div className="text-center mb-6">
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              {match.round || 'Round 1'} • {match.tournament || 'Wimbledon'}
            </p>
            <p className="text-[12px] text-gray-400">{match.date} {match.time && `at ${match.time}`}</p>
          </div>

          {/* Players */}
          <div className="space-y-4">
            {[
              { name: match.player1, img: match.player1_img, data: player1Data, key: match.player1_key },
              { name: match.player2, img: match.player2_img, data: player2Data, key: match.player2_key },
            ].map((p, i) => (
              <Link key={i} href={p.key ? `/players/${p.key}` : '#'}>
                <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100">
                  {p.img && (
                    <Image
                      src={p.img}
                      alt={p.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                      onError={e => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-bold text-gray-900">{p.name}</p>
                    {p.data && (
                      <div className="flex gap-4 mt-2 text-[12px]">
                        <span className="text-gray-600">
                          Ranking: <strong style={{ color: GREEN }}>#{p.data.ranking || 'N/A'}</strong>
                        </span>
                        <span className="text-gray-600">
                          Height: <strong>{p.data.height || 'N/A'}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* H2H */}
        {h2h && h2h.h2h && (
          <div className="card p-6 mb-6">
            <h3 className="text-[16px] font-bold text-gray-900 mb-4">Head-to-Head</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[24px] font-black" style={{ color: GREEN }}>
                  {h2h.h2h[0]?.wins || 0}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Wins</p>
                <p className="text-[12px] font-bold text-gray-900 mt-2">{match.player1}</p>
              </div>
              <div>
                <p className="text-[18px] font-bold text-gray-400">{h2h.h2h && h2h.h2h.length > 0 ? 'Meets' : 'First Time'}</p>
              </div>
              <div>
                <p className="text-[24px] font-black" style={{ color: GREEN }}>
                  {h2h.h2h[1]?.wins || 0}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Wins</p>
                <p className="text-[12px] font-bold text-gray-900 mt-2">{match.player2}</p>
              </div>
            </div>
          </div>
        )}

        {/* Voting — disabled for now (not wired up to real vote counts yet) */}
        <div className="card p-6 opacity-60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-bold text-gray-900">Who do you think will win?</h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded-full">
              Coming soon
            </span>
          </div>
          <div className="space-y-3">
            {[
              { player: '1', name: match.player1 },
              { player: '2', name: match.player2 },
            ].map((option, i) => (
              <div
                key={i}
                className="w-full p-4 rounded-2xl border-2 border-gray-200 text-left cursor-not-allowed"
              >
                <p className="font-bold text-gray-900">{option.name}</p>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2" />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-4 text-center">Match predictions are coming soon</p>
        </div>
      </main>
    </div>
  )
}
