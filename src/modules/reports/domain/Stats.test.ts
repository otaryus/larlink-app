import { describe, expect, it } from 'vitest'
import type { Contract } from '../../contracts/domain/Contract'
import type { Payment } from '../../payments/domain/Payment'
import { computeStats, isInPeriod, monthlyReport, type StatsSource } from './Stats'

const NOW = new Date('2026-10-30T10:00:00Z')
const at = (createdAt: string) => ({ createdAt })

describe('Stats', () => {
  it('checks periods', () => {
    expect(isInPeriod('2026-10-01T00:00:00Z', 'MONTH', NOW)).toBe(true)
    expect(isInPeriod('2026-09-30T00:00:00Z', 'MONTH', NOW)).toBe(false)
    expect(isInPeriod('2026-01-01T00:00:00Z', 'YEAR', NOW)).toBe(true)
    expect(isInPeriod('2020-01-01T00:00:00Z', 'ALL', NOW)).toBe(true)
  })

  it('computes dashboard stats within the period', () => {
    const source = {
      housekeepers: [at('2026-10-02'), at('2026-09-02')],
      clients: [at('2026-10-03')],
      contracts: [at('2026-10-04'), at('2025-10-04')],
      reviews: [{ rating: 5, createdAt: '2026-10-05' }, { rating: 4, createdAt: '2026-10-06' }, { rating: 1, createdAt: '2026-08-01' }],
    } as unknown as StatsSource
    expect(computeStats(source, 'MONTH', NOW)).toEqual({ housekeepers: 1, placements: 1, clients: 1, averageRating: 4.5 })
    expect(computeStats(source, 'ALL', NOW)).toEqual({ housekeepers: 2, placements: 2, clients: 1, averageRating: 3.3 })
  })

  it('builds the monthly report (newest first)', () => {
    const contracts = [at('2026-10-02T00:00:00Z'), at('2026-10-09T00:00:00Z'), at('2026-09-01T00:00:00Z')] as Contract[]
    const payments = [{ paidAt: '2026-10-02T00:00:00Z', commissionAmount: 700 }, { paidAt: '2026-10-09T00:00:00Z', commissionAmount: 750 }] as Payment[]
    expect(monthlyReport(contracts, payments)).toEqual([
      { month: '2026-10', contracts: 2, commission: 1450 },
      { month: '2026-09', contracts: 1, commission: 0 },
    ])
  })
})
