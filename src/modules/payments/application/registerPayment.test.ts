import { describe, expect, it } from 'vitest'
import { createTestContainer, seedActiveContract } from '../../../test/fixtures'

describe('registerPayment', () => {
  it('registers the next due month with computed amounts', async () => {
    const c = createTestContainer()
    const { contract } = await seedActiveContract(c)
    const p = await c.useCases.registerPayment({ contractId: contract.id, referenceMonth: '2026-10', method: 'MPESA', account: '841234567' })
    expect(p).toMatchObject({ totalAmount: 7700, commissionAmount: 700 })
    expect(await c.repositories.payments.findAll()).toHaveLength(1)
  })

  it('rejects an unknown contract', async () => {
    await expect(
      createTestContainer().useCases.registerPayment({ contractId: 'x', referenceMonth: '2026-10', method: 'MPESA', account: '841234567' }),
    ).rejects.toThrow(/contrato/)
  })
})
