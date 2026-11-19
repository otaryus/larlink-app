import { isValidMonth } from '../../../shared/domain/dates'
import { BusinessRuleError, throwIfErrors, type FieldErrors } from '../../../shared/domain/errors'
import { normalizePhone } from '../../../shared/domain/validators'
import {
  billableMonths,
  commissionOf,
  monthlyTotalOf,
  type Contract,
} from '../../contracts/domain/Contract'

export const PAYMENT_METHODS = {
  MPESA: 'M-Pesa',
  EMOLA: 'e-Mola',
  BANK_TRANSFER: 'Transferência bancária',
} as const
export type PaymentMethod = keyof typeof PAYMENT_METHODS

export interface Payment {
  readonly id: string
  readonly contractId: string
  readonly referenceMonth: string
  readonly salaryAmount: number
  readonly commissionAmount: number
  readonly totalAmount: number
  readonly method: PaymentMethod
  readonly account: string
  readonly paidAt: string
}

export interface PaymentData {
  contractId: string
  referenceMonth: string
  method: PaymentMethod
  account: string
}

export function isValidAccount(method: PaymentMethod, account: string): boolean {
  if (method === 'BANK_TRANSFER') return /^\d{21}$/.test(account.replace(/\s/g, ''))
  const phone = normalizePhone(account)
  return method === 'MPESA' ? /^8[45]\d{7}$/.test(phone) : /^8[67]\d{7}$/.test(phone)
}

const ACCOUNT_ERRORS: Record<PaymentMethod, string> = {
  MPESA: 'Número M-Pesa inválido (84/85 + 7 dígitos).',
  EMOLA: 'Número e-Mola inválido (86/87 + 7 dígitos).',
  BANK_TRANSFER: 'NIB inválido (21 dígitos).',
}

export function nextDueMonth(contract: Contract, payments: Payment[]): string | undefined {
  const paid = new Set(payments.filter((p) => p.contractId === contract.id).map((p) => p.referenceMonth))
  return billableMonths(contract).find((month) => !paid.has(month))
}

export function validatePaymentData(
  data: PaymentData,
  contract: Contract,
  payments: Payment[],
): FieldErrors {
  const errors: FieldErrors = {}
  const due = nextDueMonth(contract, payments)
  if (!isValidMonth(data.referenceMonth)) errors.referenceMonth = 'Mês de referência inválido.'
  else if (data.referenceMonth !== due)
    errors.referenceMonth = `Os pagamentos são sequenciais: o próximo mês a pagar é ${due}.`
  if (!(data.method in PAYMENT_METHODS)) errors.method = 'Seleccione o método de pagamento.'
  else if (!isValidAccount(data.method, data.account)) errors.account = ACCOUNT_ERRORS[data.method]
  return errors
}

export function createPayment(
  data: PaymentData,
  contract: Contract,
  payments: Payment[],
  id: string,
  now: Date,
): Payment {
  if (contract.status !== 'ACTIVE') throw new BusinessRuleError('Só é possível pagar contratos activos.')
  if (!nextDueMonth(contract, payments))
    throw new BusinessRuleError('Todos os meses deste contrato já foram pagos.')
  throwIfErrors(validatePaymentData(data, contract, payments))
  return {
    id,
    contractId: contract.id,
    referenceMonth: data.referenceMonth,
    salaryAmount: contract.monthlySalary,
    commissionAmount: commissionOf(contract),
    totalAmount: monthlyTotalOf(contract),
    method: data.method,
    account: data.account.replace(/\s/g, ''),
    paidAt: now.toISOString(),
  }
}
