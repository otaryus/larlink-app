import { describe, expect, it } from 'vitest'
import { BusinessRuleError } from '../../../shared/domain/errors'
import { fieldErrorsOf, housekeeperData, NOW, TODAY } from '../../../test/fixtures'
import { approveProfile, createHousekeeper } from '../../housekeepers/domain/Housekeeper'
import {
  approveHireRequest,
  cancelHireRequest,
  createHireRequest,
  rejectHireRequest,
  type HireRequestData,
} from './HireRequest'

const pendingHk = createHousekeeper(housekeeperData(), 'h1', NOW)
const hk = approveProfile(pendingHk)
const data = (overrides: Partial<HireRequestData> = {}): HireRequestData => ({
  clientId: 'c1',
  housekeeperId: 'h1',
  requiredSkills: ['CLEANING'],
  requiredDays: ['MON'],
  startDate: TODAY,
  notes: '',
  ...overrides,
})

describe('HireRequest', () => {
  it('is created PENDING for an approved housekeeper', () => {
    expect(createHireRequest(data(), hk, 'r1', NOW).status).toBe('PENDING')
  })

  it('cannot be made for a housekeeper whose profile is not approved', () => {
    expect(() => createHireRequest(data(), pendingHk, 'r1', NOW)).toThrow(BusinessRuleError)
  })

  it('requested skills and days must be offered by the housekeeper', () => {
    const errors = fieldErrorsOf(() =>
      createHireRequest(data({ requiredSkills: ['GARDENING'], requiredDays: ['SUN'] }), hk, 'r1', NOW),
    )
    expect(errors.requiredSkills).toMatch(/competências/)
    expect(errors.requiredDays).toMatch(/disponível/)
  })

  it('requires client, at least one skill/day and a non-past start date', () => {
    const errors = fieldErrorsOf(() =>
      createHireRequest(data({ clientId: '', requiredSkills: [], requiredDays: [], startDate: '2026-10-29' }), hk, 'r1', NOW),
    )
    expect(Object.keys(errors).sort()).toEqual(['clientId', 'requiredDays', 'requiredSkills', 'startDate'])
  })

  it('limits notes to 300 characters', () => {
    expect(fieldErrorsOf(() => createHireRequest(data({ notes: 'x'.repeat(301) }), hk, 'r1', NOW))).toHaveProperty('notes')
  })

  describe('state transitions', () => {
    const pending = () => createHireRequest(data(), hk, 'r1', NOW)

    it('PENDING → APPROVED / REJECTED / CANCELLED', () => {
      expect(approveHireRequest(pending()).status).toBe('APPROVED')
      expect(rejectHireRequest(pending(), 'Empregada indisponível').status).toBe('REJECTED')
      expect(cancelHireRequest(pending()).status).toBe('CANCELLED')
    })

    it('rejection requires a reason', () => {
      expect(fieldErrorsOf(() => rejectHireRequest(pending(), ''))).toHaveProperty('reason')
    })

    it('a decided request cannot change again', () => {
      const approved = approveHireRequest(pending())
      expect(() => cancelHireRequest(approved)).toThrow(BusinessRuleError)
      expect(() => approveHireRequest(approved)).toThrow(BusinessRuleError)
    })
  })
})
