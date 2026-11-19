import { describe, expect, it } from 'vitest'
import { createTestContainer, seedActiveContract } from '../../../test/fixtures'

describe('submitReview', () => {
  it('needs a payment first, then allows exactly one review per contract', async () => {
    const c = createTestContainer()
    const { contract } = await seedActiveContract(c)
    const review = { contractId: contract.id, rating: 5, comment: 'Excelente' }

    await expect(c.useCases.submitReview(review)).rejects.toThrow(/primeiro pagamento/)
    await c.useCases.registerPayment({ contractId: contract.id, referenceMonth: '2026-10', method: 'MPESA', account: '841234567' })
    expect((await c.useCases.submitReview(review)).rating).toBe(5)
    await expect(c.useCases.submitReview(review)).rejects.toThrow(/já foi avaliado/)
  })
})
