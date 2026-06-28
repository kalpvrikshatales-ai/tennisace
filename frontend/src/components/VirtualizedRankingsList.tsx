'use client'

import { FixedSizeList as List } from 'react-window'
import Link from 'next/link'
import { getFlag } from '@/lib/flags'

const SURFACE_DOTS: Record<string, string> = {
  Grass: '#22C55E', Clay: '#F97316', Hard: '#3B82F6',
}

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

const RankRow = ({ index, style, data }: { index: number; style: React.CSSProperties; data: RankEntry[] }) => {
  const item = data[index]
  if (!item) return null

  return (
    <div style={style} className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between gap-3 hover:bg-gray-50">
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
        <Link href={item.player_key ? `/players/${item.player_key}` : '#'}>
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
  )
}

export default function VirtualizedRankingsList({ items, height, itemSize = 45 }: Props) {
  if (items.length === 0) {
    return <div className="p-4 text-center text-gray-400 text-sm">No rankings found</div>
  }

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemSize}
      width="100%"
      itemData={items}
    >
      {RankRow}
    </List>
  )
}
