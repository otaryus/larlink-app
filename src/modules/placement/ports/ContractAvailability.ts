export interface ContractAvailability {
  hasActiveContract(housekeeperId: string): Promise<boolean>
}
