'use client'

import Link from 'next/link'
import { getFlag } from '@/lib/flags'
import { toSlug } from '@/lib/playerSlug'
import { useState, useEffect, useRef } from 'react'

interface RankEntry {
  place: string
  player: string
  player_key?: number
  country?: string
  points?: string
  movement?: string
  age?: string
  league?: string
}

interface Props {
  items: RankEntry[]
  height: number
  itemSize?: number
}

function MovementIcon({ m }: { m?: string }) {
  if (m === 'up') return <span className="text-[10px] text-green-500">▲</span>
  if (m === 'down') return <span className="text-[10px] text-red-400">▼</span>
  return <span className="text-[10px] text-gray-300">—</span>
}

export default function VirtualizedRankingsList({ items, height }: Props) {
  const [visibleCount, setVisibleCount] = useState(30)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      if (scrollHeight - scrollTop - clientHeight < 500) {
        setVisibleCount((prev) => Math.min(prev + 30, items.length))
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [items.length])

  if (items.length === 0) {
    return <div className="p-4 text-center text-gray-400 text-sm">No rankings found</div>
  }

  const visibleItems = items.slice(0, visibleCount)

  return (
    <div ref={containerRef} style={{ height: `${height}px` }} className="overflow-y-auto">
      <div className="divide-y divide-gray-100">
        {visibleItems.map((item, i) => (
          <div key={i} className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-gray-50">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="text-xs font-bold text-gray-400 w-6">{item.place}</span>
              <span className="text-xs text-gray-300 w-5 text-center">
                <MovementIcon m={item.movement} />
              </span>
              {item.country && (
                <span className="text-base flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-sm bg-gray-100">
                  {getFlag(item.country)}
                </span>
              )}
              <Link href={item.player ? `/players/${toSlug(item.player)}` : '#'}>
                <span className="text-xs font-semibold text-gray-900 truncate hover:text-blue-600">
                  {item.player}
                </span>
              </Link>
            </div>
            {item.points && (
              <span className="text-xs font-bold text-gray-900 flex-shrink-0 tabular-nums">
                {parseInt(item.points).toLocaleString()}
              </span>
            )}
          </div>
        ))}
      </div>
      {visibleCount < items.length && (
        <div className="p-4 text-center text-gray-400 text-sm">
          Loaded {visibleCount} of {items.length} • Scroll for more
        </div>
      )}
    </div>
  )
}
