import { describe, expect, it } from 'vitest'
import { formatDate, formatMonth, formatMZN } from './format'

describe('format', () => {
  it('formats dates the way the dashboard shows them', () => {
    expect(formatDate('2026-10-24T08:00:00Z')).toBe('24 Out 2026')
    expect(formatDate('2026-01-05')).toBe('5 Jan 2026')
    expect(formatMonth('2026-12')).toBe('Dez 2026')
  })

  it('formats currency in meticais', () => {
    expect(formatMZN(7700)).toMatch(/^7.?700,00 MZN$/)
  })
})
