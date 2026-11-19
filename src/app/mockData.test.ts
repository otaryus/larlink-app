import { describe, expect, it } from 'vitest'
import { recentPlacements } from '../modules/placement/domain/PlacementStatus'
import { computeStats } from '../modules/reports/domain/Stats'
import { NOW } from '../test/fixtures'
import { createContainer, createInMemoryRepositories } from './container'
import { buildMockData, DEMO_ACCOUNT, loadMockData } from './mockData'

describe('mock dataset (small — system in development)', () => {
  const data = buildMockData(NOW)

  it('has only a handful of records', () => {
    expect(computeStats(data, 'MONTH', NOW)).toEqual({ housekeepers: 8, placements: 2, clients: 5, averageRating: 4.6 })
    expect(data.housekeepers.filter((h) => h.status === 'PENDING')).toHaveLength(2)
  })

  it('has unique ids and dates strictly before now', () => {
    for (const list of Object.values(data)) expect(new Set(list.map((e: { id: string }) => e.id)).size).toBe(list.length)
    const dates = [...data.clients, ...data.housekeepers, ...data.contracts, ...data.reviews].map((e) => e.createdAt)
    for (const d of dates) expect(d < NOW.toISOString()).toBe(true)
  })

  it('covers every placement stage', () => {
    const names = new Map(data.housekeepers.map((h) => [h.id, h.name]))
    expect(recentPlacements(data.hireRequests, data.contracts).map((p) => [names.get(p.request.housekeeperId), p.stage])).toEqual([
      ['Maria Langa', 'NEW_REQUEST'],
      ['Ana Carlos', 'COMPLETED'],
      ['Graça Bila', 'IN_PROGRESS'],
      ['Lúcia Mondlane', 'CONTRACT_SIGNED'],
    ])
  })

  it('demo account signs in with admin@larlink.co.mz / teste@123', async () => {
    const repositories = createInMemoryRepositories()
    await loadMockData(repositories, NOW)
    const { useCases } = createContainer(repositories, { generateId: () => 'x', now: () => NOW })
    expect(DEMO_ACCOUNT).toMatchObject({ email: 'admin@larlink.co.mz', password: 'teste@123' })
    expect((await useCases.signIn({ email: 'admin@larlink.co.mz', password: 'teste@123' })).role).toBe('AGENCY')
  })

  it('home ranking: most reviewed first, hired housekeepers excluded', async () => {
    const repositories = createInMemoryRepositories()
    await loadMockData(repositories, NOW)
    const results = await createContainer(repositories, { generateId: () => 'x', now: () => NOW }).useCases.searchHousekeepers({})
    expect(results.map((h) => h.name)).toEqual(['Ana Carlos', 'Helena Quissanga', 'Beatriz Matusse', 'Graça Bila', 'Maria Langa'])
  })
})
