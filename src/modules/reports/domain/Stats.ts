import type { Client } from '../../clients/domain/Client'
import type { Contract } from '../../contracts/domain/Contract'
import type { Housekeeper } from '../../housekeepers/domain/Housekeeper'
import type { Payment } from '../../payments/domain/Payment'
import { averageRating, type Review } from '../../reviews/domain/Review'

export const PERIODS = { MONTH: 'Este mês', YEAR: 'Este ano', ALL: 'Sempre' } as const
export type Period = keyof typeof PERIODS

export function isInPeriod(isoDateTime: string, period: Period, now: Date): boolean {
  if (period === 'ALL') return true
  const prefix = now.toISOString().slice(0, period === 'MONTH' ? 7 : 4)
  return isoDateTime.startsWith(prefix)
}

export interface DashboardStats {
  housekeepers: number
  placements: number
  clients: number
  averageRating: number | null
}

export interface StatsSource {
  housekeepers: Housekeeper[]
  clients: Client[]
  contracts: Contract[]
  reviews: Review[]
}

export function computeStats(source: StatsSource, period: Period, now: Date): DashboardStats {
  const within = <T extends { createdAt: string }>(items: T[]) => items.filter((i) => isInPeriod(i.createdAt, period, now))
  return {
    housekeepers: within(source.housekeepers).length,
    placements: within(source.contracts).length,
    clients: within(source.clients).length,
    averageRating: averageRating(within(source.reviews)),
  }
}

export interface MonthlyRow {
  month: string
  contracts: number
  commission: number
}

export function monthlyReport(contracts: Contract[], payments: Payment[]): MonthlyRow[] {
  const rows = new Map<string, MonthlyRow>()
  const row = (month: string) => rows.get(month) ?? rows.set(month, { month, contracts: 0, commission: 0 }).get(month)!
  contracts.forEach((c) => row(c.createdAt.slice(0, 7)).contracts++)
  payments.forEach((p) => (row(p.paidAt.slice(0, 7)).commission += p.commissionAmount))
  return [...rows.values()].sort((a, b) => b.month.localeCompare(a.month))
}
