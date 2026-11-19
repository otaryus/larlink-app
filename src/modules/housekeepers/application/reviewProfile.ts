import { BusinessRuleError } from '../../../shared/domain/errors'
import { approveProfile, rejectProfile, type Housekeeper } from '../domain/Housekeeper'
import type { HousekeeperRepository } from '../ports/HousekeeperRepository'

export interface ReviewProfileCommand {
  housekeeperId: string
  decision: 'APPROVE' | 'REJECT'
  reason?: string
}

export function makeReviewProfile({ housekeepers }: { housekeepers: HousekeeperRepository }) {
  return async function reviewProfile(command: ReviewProfileCommand): Promise<Housekeeper> {
    const housekeeper = await housekeepers.findById(command.housekeeperId)
    if (!housekeeper) throw new BusinessRuleError('Empregada não encontrada.')
    const updated =
      command.decision === 'APPROVE'
        ? approveProfile(housekeeper)
        : rejectProfile(housekeeper, command.reason ?? '')
    await housekeepers.save(updated)
    return updated
  }
}
