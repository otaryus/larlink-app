import { BusinessRuleError } from '../../../shared/domain/errors'
import type { Clock, IdGenerator } from '../../../shared/ports/services'
import type { ContractRepository } from '../../contracts/ports/ContractRepository'
import type { PaymentRepository } from '../../payments/ports/PaymentRepository'
import { createReview, type Review, type ReviewData } from '../domain/Review'
import type { ReviewRepository } from '../ports/ReviewRepository'

export type SubmitReviewCommand = ReviewData

export interface SubmitReviewDeps {
  reviews: ReviewRepository
  contracts: ContractRepository
  payments: PaymentRepository
  generateId: IdGenerator
  now: Clock
}

export function makeSubmitReview(deps: SubmitReviewDeps) {
  return async function submitReview(command: SubmitReviewCommand): Promise<Review> {
    const contract = await deps.contracts.findById(command.contractId)
    if (!contract) throw new BusinessRuleError('Seleccione um contrato válido.')
    if ((await deps.reviews.findAll()).some((r) => r.contractId === contract.id))
      throw new BusinessRuleError('Este contrato já foi avaliado.')
    const paymentCount = (await deps.payments.findAll()).filter(
      (p) => p.contractId === contract.id,
    ).length
    const review = createReview(command, contract, paymentCount, deps.generateId(), deps.now())
    await deps.reviews.save(review)
    return review
  }
}
