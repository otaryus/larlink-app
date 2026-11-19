import type { ContractAvailability } from '../../placement/ports/ContractAvailability'
import type { ContractRepository } from '../ports/ContractRepository'

export class ContractAvailabilityAdapter implements ContractAvailability {
  private readonly contracts: ContractRepository

  constructor(contracts: ContractRepository) {
    this.contracts = contracts
  }

  async hasActiveContract(housekeeperId: string): Promise<boolean> {
    return (await this.contracts.findAll()).some(
      (c) => c.housekeeperId === housekeeperId && c.status === 'ACTIVE',
    )
  }
}
