import { describe, expect, it } from 'vitest'
import { createTestContainer, seedActiveContract } from '../../../test/fixtures'

describe('getDashboard', () => {
  it('aggregates the repositories', async () => {
    const c = createTestContainer()
    await seedActiveContract(c)
    expect(await c.useCases.getDashboard('MONTH')).toEqual({ housekeepers: 1, placements: 1, clients: 1, averageRating: null })
  })
})
