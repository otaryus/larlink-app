import { describe, expect, it } from 'vitest'
import { addMonths, ageAt, isValidDate, isValidMonth, monthOf, nextMonth } from './dates'

describe('dates', () => {
  it('validates ISO dates including impossible days', () => {
    expect(isValidDate('2026-02-28')).toBe(true)
    expect(isValidDate('2026-02-30')).toBe(false)
    expect(isValidDate('30/10/2026')).toBe(false)
  })

  it('validates months', () => {
    expect(isValidMonth('2026-12')).toBe(true)
    expect(isValidMonth('2026-13')).toBe(false)
  })

  it('computes age considering birthday not yet reached', () => {
    const now = new Date('2026-10-30T00:00:00Z')
    expect(ageAt('2008-10-30', now)).toBe(18)
    expect(ageAt('2008-10-31', now)).toBe(17)
  })

  it('adds months and rolls over years', () => {
    expect(addMonths('2026-11-15', 3)).toBe('2027-02-15')
    expect(monthOf('2026-11-15')).toBe('2026-11')
    expect(nextMonth('2026-12')).toBe('2027-01')
  })
})
