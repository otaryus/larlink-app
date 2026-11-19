import { describe, expect, it } from 'vitest'
import { BusinessRuleError } from '../../../shared/domain/errors'
import { createTestContainer, seedActiveContract, seedClientAndApprovedHousekeeper, TODAY } from '../../../test/fixtures'

describe('signContract', () => {
  it('signs a contract for an approved request', async () => {
    const { contract } = await seedActiveContract(createTestContainer())
    expect(contract).toMatchObject({ status: 'ACTIVE', monthlySalary: 7000, durationMonths: 3 })
  })

  it('rejects a second contract for the same request', async () => {
    const c = createTestContainer()
    const { request } = await seedActiveContract(c)
    await expect(c.useCases.signContract({ hireRequestId: request.id, monthlySalary: 7000, durationMonths: 3 })).rejects.toThrow(/Já existe/)
  })

  it('rejects a pending (not approved) request', async () => {
    const c = createTestContainer()
    const { client, housekeeper } = await seedClientAndApprovedHousekeeper(c)
    const r = await c.useCases.submitHireRequest({ clientId: client.id, housekeeperId: housekeeper.id, requiredSkills: ['CLEANING'], requiredDays: ['MON'], startDate: TODAY, notes: '' })
    await expect(c.useCases.signContract({ hireRequestId: r.id, monthlySalary: 7000, durationMonths: 3 })).rejects.toBeInstanceOf(BusinessRuleError)
  })
})

describe('endContract', () => {
  it('terminates an active contract once', async () => {
    const c = createTestContainer()
    const { contract } = await seedActiveContract(c)
    expect((await c.useCases.endContract(contract.id)).status).toBe('TERMINATED')
    await expect(c.useCases.endContract(contract.id)).rejects.toBeInstanceOf(BusinessRuleError)
  })
})
