import { BusinessRuleError } from '../../../shared/domain/errors'
import type { Clock } from '../../../shared/ports/services'
import { terminateContract, type Contract } from '../domain/Contract'
import type { ContractRepository } from '../ports/ContractRepository'

export function makeEndContract({ contracts, now }: { contracts: ContractRepository; now: Clock }) {
  return async function endContract(contractId: string): Promise<Contract> {
    const contract = await contracts.findById(contractId)
    if (!contract) throw new BusinessRuleError('Contrato não encontrado.')
    const ended = terminateContract(contract, now())
    await contracts.save(ended)
    return ended
  }
}
