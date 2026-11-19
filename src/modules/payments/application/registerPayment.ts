import { BusinessRuleError } from '../../../shared/domain/errors'
import type { Clock, IdGenerator } from '../../../shared/ports/services'
import type { ContractRepository } from '../../contracts/ports/ContractRepository'
import { createPayment, type Payment, type PaymentData } from '../domain/Payment'
import type { PaymentRepository } from '../ports/PaymentRepository'

export type RegisterPaymentCommand = PaymentData

export interface RegisterPaymentDeps {
  payments: PaymentRepository
  contracts: ContractRepository
  generateId: IdGenerator
  now: Clock
}

export function makeRegisterPayment(deps: RegisterPaymentDeps) {
  return async function registerPayment(command: RegisterPaymentCommand): Promise<Payment> {
    const contract = await deps.contracts.findById(command.contractId)
    if (!contract) throw new BusinessRuleError('Seleccione um contrato válido.')
    const existing = await deps.payments.findAll()
    const payment = createPayment(command, contract, existing, deps.generateId(), deps.now())
    await deps.payments.save(payment)
    return payment
  }
}
