import { describe, expect, it } from 'vitest'
import { byNewest, newestFirst } from './sorting'

describe('sorting', () => {
  const items = [
    { id: 'old', createdAt: '2026-10-01T08:00:00Z' },
    { id: 'new', createdAt: '2026-10-29T08:00:00Z' },
    { id: 'mid', createdAt: '2026-10-15T08:00:00Z' },
  ]

  it('puts the most recent first', () => {
    expect(newestFirst(items).map((i) => i.id)).toEqual(['new', 'mid', 'old'])
    expect([...items].sort(byNewest)[0].id).toBe('new')
  })

  it('does not mutate the input', () => {
    newestFirst(items)
    expect(items[0].id).toBe('old')
  })
})
