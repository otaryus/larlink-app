import { useState } from 'react'

const KEY = 'larlink.favorites'

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(read)

  function toggle(id: string) {
    const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id]
    setFavorites(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
    }
  }

  return { isFavorite: (id: string) => favorites.includes(id), toggle }
}
