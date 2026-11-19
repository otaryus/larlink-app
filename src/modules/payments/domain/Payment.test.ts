import { describe, expect, it } from 'vitest'
import { BusinessRuleError } from '../../../shared/domain/errors'
import { fieldErrorsOf, NOW } from '../../../test/fixtures'
import { terminateContract, type Contract } from '../../contracts/domain/Contract'
import { createPayment, isValidAccount, nextDueMonth, type Payment, type PaymentData } from './Payment'

const contract: Contract = {
  id: 'k1',
  hireRequestId: 'r1',
  clientId: 'c1',
  housekeeperId: 'h1',
  monthlySalary: 7000,
  durationMonths: 2,
  startDate: '2026-11-01',
  endDate: '2027-01-01',
  commissionRate: 0.1,
  status: 'ACTIVE',
  createdAt: NOW.toISOString(),
}
const data = (overrides: Partial<PaymentData> = {}): PaymentData => ({
  contractId: 'k1',
  referenceMonth: '2026-11',
  method: 'MPESA',
  account: '84 123 4567',
  ...overrides,
})
const pay = (payments: Payment[] = [], overrides: Partial<PaymentData> = {}) =>
  createPayment(data(overrides), contract, payments, `p${payments.length + 1}`, NOW)

describe('Payment', () => {
  it('amounts are computed from the contract (salary + 10% commission)', () => {
    expect(pay()).toMatchObject({ salaryAmount: 7000, commissionAmount: 700, totalAmount: 7700, account: '841234567' })
  })

  it('validates the account per method', () => {
    expect(isValidAccount('MPESA', '851234567')).toBe(true)
    expect(isValidAccount('MPESA', '861234567')).toBe(false)
    expect(isValidAccount('EMOLA', '+258 87 123 4567')).toBe(true)
    expect(isValidAccount('EMOLA', '841234567')).toBe(false)
    expect(isValidAccount('BANK_TRANSFER', '0001 0000 1234 5678 9012 3')).toBe(true)
    expect(isValidAccount('BANK_TRANSFER', '1234')).toBe(false)
  })

  it('reports a method-specific account error', () => {
    expect(fieldErrorsOf(() => pay([], { method: 'EMOLA', account: '841234567' })).account).toMatch(/e-Mola/)
  })

  it('payments are sequential: the next due month must be paid first', () => {
    expect(fieldErrorsOf(() => pay([], { referenceMonth: '2026-12' })).referenceMonth).toMatch(/2026-11/)
    const first = pay()
    expect(nextDueMonth(contract, [first])).toBe('2026-12')
    expect(pay([first], { referenceMonth: '2026-12' }).referenceMonth).toBe('2026-12')
  })

  it('cannot pay a month twice nor beyond the contract duration', () => {
    const first = pay()
    expect(fieldErrorsOf(() => pay([first]))).toHaveProperty('referenceMonth')
    const second = pay([first], { referenceMonth: '2026-12' })
    expect(nextDueMonth(contract, [first, second])).toBeUndefined()
    expect(() => pay([first, second], { referenceMonth: '2027-01' })).toThrow(/já foram pagos/)
  })

  it('only active contracts can be paid', () => {
    expect(() => createPayment(data(), terminateContract(contract, NOW), [], 'p1', NOW)).toThrow(BusinessRuleError)
  })
})
