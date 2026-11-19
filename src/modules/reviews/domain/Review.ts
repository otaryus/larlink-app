import { BusinessRuleError, throwIfErrors, type FieldErrors } from '../../../shared/domain/errors'
import { isIntegerBetween } from '../../../shared/domain/validators'
import type { Contract } from '../../contracts/domain/Contract'

export const MIN_COMMENT_FOR_LOW_RATING = 20
export const MAX_COMMENT_LENGTH = 500

export interface Review {
  readonly id: string
  readonly contractId: string
  readonly housekeeperId: string
  readonly clientId: string
  readonly rating: number
  readonly comment: string
  readonly createdAt: string
}

export interface ReviewData {
  contractId: string
  rating: number
  comment: string
}

export function validateReviewData(data: ReviewData): FieldErrors {
  const errors: FieldErrors = {}
  const comment = data.comment.trim()
  if (!isIntegerBetween(data.rating, 1, 5)) errors.rating = 'A nota deve ser entre 1 e 5.'
  else if (data.rating <= 2 && comment.length < MIN_COMMENT_FOR_LOW_RATING)
    errors.comment = `Para notas baixas, justifique (mín. ${MIN_COMMENT_FOR_LOW_RATING} caracteres).`
  if (comment.length > MAX_COMMENT_LENGTH) errors.comment = `Máximo de ${MAX_COMMENT_LENGTH} caracteres.`
  return errors
}

export function canBeReviewed(contract: Contract, paymentCount: number): boolean {
  return contract.status === 'TERMINATED' || paymentCount > 0
}

export function createReview(
  data: ReviewData,
  contract: Contract,
  paymentCount: number,
  id: string,
  now: Date,
): Review {
  if (!canBeReviewed(contract, paymentCount))
    throw new BusinessRuleError('Só pode avaliar após o primeiro pagamento ou o fim do contrato.')
  throwIfErrors(validateReviewData(data))
  return {
    id,
    contractId: contract.id,
    housekeeperId: contract.housekeeperId,
    clientId: contract.clientId,
    rating: data.rating,
    comment: data.comment.trim(),
    createdAt: now.toISOString(),
  }
}

export function averageRating(reviews: Review[]): number | null {
  if (reviews.length === 0) return null
  const sum = reviews.reduce((total, r) => total + r.rating, 0)
  return Math.round((sum / reviews.length) * 10) / 10
}
