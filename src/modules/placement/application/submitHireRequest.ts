import { BusinessRuleError } from '../../../shared/domain/errors'
import type { Clock, IdGenerator } from '../../../shared/ports/services'
import type { ClientRepository } from '../../clients/ports/ClientRepository'
import type { HousekeeperRepository } from '../../housekeepers/ports/HousekeeperRepository'
import { createHireRequest, type HireRequest, type HireRequestData } from '../domain/HireRequest'
import type { ContractAvailability } from '../ports/ContractAvailability'
import type { HireRequestRepository } from '../ports/HireRequestRepository'

export type SubmitHireRequestCommand = HireRequestData

export interface SubmitHireRequestDeps {
  hireRequests: HireRequestRepository
  clients: ClientRepository
  housekeepers: HousekeeperRepository
  availability: ContractAvailability
  generateId: IdGenerator
  now: Clock
}

export function makeSubmitHireRequest(deps: SubmitHireRequestDeps) {
  return async function submitHireRequest(command: SubmitHireRequestCommand): Promise<HireRequest> {
    const housekeeper = await deps.housekeepers.findById(command.housekeeperId)
    if (!housekeeper) throw new BusinessRuleError('Empregada não encontrada.')
    const request = createHireRequest(command, housekeeper, deps.generateId(), deps.now())

    if (!(await deps.clients.findById(command.clientId)))
      throw new BusinessRuleError('Cliente não encontrado.')
    if (await deps.availability.hasActiveContract(housekeeper.id))
      throw new BusinessRuleError('A empregada já tem um contrato activo.')
    const duplicate = (await deps.hireRequests.findAll()).some(
      (r) =>
        r.clientId === command.clientId &&
        r.housekeeperId === command.housekeeperId &&
        r.status === 'PENDING',
    )
    if (duplicate)
      throw new BusinessRuleError('Já existe um pedido pendente deste cliente para esta empregada.')

    await deps.hireRequests.save(request)
    return request
  }
}
