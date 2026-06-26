'use client'

import { useState, useEffect } from 'react'
import { isFavourite, toggleFavourite, FavPlayer } from '@/lib/favourites'

interface Props { player: FavPlayer; size?: 'sm' | 'md' }

export default function FavButton({ player, size = 'md' }: Props) {
  const [fav, setFav] = useState(false)
  const [pop, setPop] = useState(false)

  useEffect(() => { setFav(isFavourite(player.key)) }, [player.key])

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const result = toggleFavourite(player)
    setFav(result)
    setPop(true)
    setTimeout(() => setPop(false), 300)
  }

  const sz = size === 'sm' ? 'text-base p-1' : 'text-xl p-2'

  return (
    <button
      onClick={toggle}
      className={`${sz} transition-all rounded-full hover:bg-gray-50 ${pop ? 'star-pop' : ''}`}
      title={fav ? 'Remove from favourites' : 'Add to favourites'}
    >
      {fav ? (
        <span className="text-amber-400">★</span>
      ) : (
        <span className="text-gray-300 hover:text-gray-500">☆</span>
      )}
    </button>
  )
}
