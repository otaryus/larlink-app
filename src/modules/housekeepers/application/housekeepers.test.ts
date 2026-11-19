import { describe, expect, it } from 'vitest'
import { BusinessRuleError, ValidationError } from '../../../shared/domain/errors'
import { createTestContainer, housekeeperData } from '../../../test/fixtures'

describe('registerHousekeeper', () => {
  it('stores a PENDING profile', async () => {
    const c = createTestContainer()
    const h = await c.useCases.registerHousekeeper(housekeeperData())
    expect((await c.repositories.housekeepers.findById(h.id))?.status).toBe('PENDING')
  })

  it('rejects a phone already used by another profile', async () => {
    const c = createTestContainer()
    await c.useCases.registerHousekeeper(housekeeperData())
    await expect(c.useCases.registerHousekeeper(housekeeperData({ name: 'Outra Pessoa', phone: '+258 86 111 2233' }))).rejects.toBeInstanceOf(ValidationError)
  })
})

describe('reviewProfile', () => {
  it('approves and persists', async () => {
    const c = createTestContainer()
    const h = await c.useCases.registerHousekeeper(housekeeperData())
    await c.useCases.reviewProfile({ housekeeperId: h.id, decision: 'APPROVE' })
    expect((await c.repositories.housekeepers.findById(h.id))?.status).toBe('APPROVED')
  })

  it('rejects with a reason', async () => {
    const c = createTestContainer()
    const h = await c.useCases.registerHousekeeper(housekeeperData())
    await c.useCases.reviewProfile({ housekeeperId: h.id, decision: 'REJECT', reason: 'Referências não confirmadas' })
    expect(await c.repositories.housekeepers.findById(h.id)).toMatchObject({ status: 'REJECTED', rejectionReason: 'Referências não confirmadas' })
  })

  it('fails for an unknown housekeeper', async () => {
    await expect(createTestContainer().useCases.reviewProfile({ housekeeperId: 'x', decision: 'APPROVE' })).rejects.toBeInstanceOf(BusinessRuleError)
  })
})
