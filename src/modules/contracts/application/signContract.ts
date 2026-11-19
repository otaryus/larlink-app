import { BusinessRuleError } from '../../../shared/domain/errors'
import type { Clock, IdGenerator } from '../../../shared/ports/services'
import type { HousekeeperRepository } from '../../housekeepers/ports/HousekeeperRepository'
import type { HireRequestRepository } from '../../placement/ports/HireRequestRepository'
import { createContract, type Contract, type ContractData } from '../domain/Contract'
import type { ContractRepository } from '../ports/ContractRepository'

export type SignContractCommand = ContractData

export interface SignContractDeps {
  contracts: ContractRepository
  hireRequests: HireRequestRepository
  housekeepers: HousekeeperRepository
  generateId: IdGenerator
  now: Clock
}

export function makeSignContract(deps: SignContractDeps) {
  return async function signContract(command: SignContractCommand): Promise<Contract> {
    const request = await deps.hireRequests.findById(command.hireRequestId)
    if (!request) throw new BusinessRuleError('Seleccione um pedido aprovado.')
    const housekeeper = await deps.housekeepers.findById(request.housekeeperId)
    if (!housekeeper) throw new BusinessRuleError('Empregada não encontrada.')

    const contract = createContract(command, request, housekeeper, deps.generateId(), deps.now())

    const existing = await deps.contracts.findAll()
    if (existing.some((c) => c.hireRequestId === request.id))
      throw new BusinessRuleError('Já existe um contrato para este pedido.')
    if (existing.some((c) => c.housekeeperId === housekeeper.id && c.status === 'ACTIVE'))
      throw new BusinessRuleError('A empregada já tem um contrato activo.')

    await deps.contracts.save(contract)
    return contract
  }
}
