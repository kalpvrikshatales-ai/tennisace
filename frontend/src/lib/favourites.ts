const KEY = 'tennisace_favourites'

export interface FavPlayer {
  key: number
  name: string
  country: string
  league: string
}

export function getFavourites(): FavPlayer[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

export function isFavourite(key: number): boolean {
  return getFavourites().some(f => f.key === key)
}

export function toggleFavourite(player: FavPlayer): boolean {
  const favs = getFavourites()
  const idx = favs.findIndex(f => f.key === player.key)
  if (idx >= 0) {
    favs.splice(idx, 1)
    localStorage.setItem(KEY, JSON.stringify(favs))
    return false
  } else {
    favs.unshift(player)
    localStorage.setItem(KEY, JSON.stringify(favs))
    return true
  }
}
