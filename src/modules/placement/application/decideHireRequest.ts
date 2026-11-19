import { BusinessRuleError } from '../../../shared/domain/errors'
import {
  approveHireRequest,
  cancelHireRequest,
  rejectHireRequest,
  type HireRequest,
} from '../domain/HireRequest'
import type { ContractAvailability } from '../ports/ContractAvailability'
import type { HireRequestRepository } from '../ports/HireRequestRepository'

export interface DecideHireRequestCommand {
  hireRequestId: string
  decision: 'APPROVE' | 'REJECT' | 'CANCEL'
  reason?: string
}

export interface DecideHireRequestDeps {
  hireRequests: HireRequestRepository
  availability: ContractAvailability
}

export function makeDecideHireRequest({ hireRequests, availability }: DecideHireRequestDeps) {
  return async function decideHireRequest(command: DecideHireRequestCommand): Promise<HireRequest> {
    const request = await hireRequests.findById(command.hireRequestId)
    if (!request) throw new BusinessRuleError('Pedido não encontrado.')

    let updated: HireRequest
    if (command.decision === 'APPROVE') {
      if (await availability.hasActiveContract(request.housekeeperId))
        throw new BusinessRuleError('A empregada já tem um contrato activo.')
      updated = approveHireRequest(request)
    } else if (command.decision === 'REJECT') {
      updated = rejectHireRequest(request, command.reason ?? '')
    } else {
      updated = cancelHireRequest(request)
    }

    await hireRequests.save(updated)
    return updated
  }
}
