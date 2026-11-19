import { describe, expect, it } from 'vitest'
import { BusinessRuleError } from '../../../shared/domain/errors'
import { fieldErrorsOf, NOW } from '../../../test/fixtures'
import { terminateContract, type Contract } from '../../contracts/domain/Contract'
import { averageRating, canBeReviewed, createReview, validateReviewData, type Review } from './Review'

const active: Contract = {
  id: 'k1',
  hireRequestId: 'r1',
  clientId: 'c1',
  housekeeperId: 'h1',
  monthlySalary: 7000,
  durationMonths: 3,
  startDate: '2026-11-01',
  endDate: '2027-02-01',
  commissionRate: 0.1,
  status: 'ACTIVE',
  createdAt: NOW.toISOString(),
}

describe('Review', () => {
  it('requires the service to have happened (a payment or a terminated contract)', () => {
    expect(canBeReviewed(active, 0)).toBe(false)
    expect(canBeReviewed(active, 1)).toBe(true)
    expect(canBeReviewed(terminateContract(active, NOW), 0)).toBe(true)
    expect(() => createReview({ contractId: 'k1', rating: 5, comment: '' }, active, 0, 'v1', NOW)).toThrow(BusinessRuleError)
  })

  it('copies housekeeper and client from the contract', () => {
    expect(createReview({ contractId: 'k1', rating: 5, comment: ' Óptima ' }, active, 1, 'v1', NOW)).toMatchObject({
      housekeeperId: 'h1',
      clientId: 'c1',
      comment: 'Óptima',
    })
  })

  it('rating must be an integer from 1 to 5', () => {
    for (const rating of [0, 6, 4.5]) expect(validateReviewData({ contractId: 'k1', rating, comment: '' })).toHaveProperty('rating')
  })

  it('low ratings (≤ 2) require a justification of at least 20 characters', () => {
    expect(fieldErrorsOf(() => createReview({ contractId: 'k1', rating: 2, comment: 'Mau' }, active, 1, 'v1', NOW))).toHaveProperty('comment')
    expect(validateReviewData({ contractId: 'k1', rating: 2, comment: 'Chegou atrasada várias vezes.' })).toEqual({})
    expect(validateReviewData({ contractId: 'k1', rating: 3, comment: '' })).toEqual({})
  })

  it('limits comments to 500 characters', () => {
    expect(validateReviewData({ contractId: 'k1', rating: 5, comment: 'x'.repeat(501) })).toHaveProperty('comment')
  })

  it('computes the average with one decimal', () => {
    const r = (rating: number) => ({ rating }) as Review
    expect(averageRating([])).toBeNull()
    expect(averageRating([r(5), r(4), r(4)])).toBe(4.3)
  })
})
