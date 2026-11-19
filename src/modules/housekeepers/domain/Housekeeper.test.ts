import { describe, expect, it } from 'vitest'
import { BusinessRuleError } from '../../../shared/domain/errors'
import { MINIMUM_WAGE_MZN } from '../../../shared/domain/policies'
import { fieldErrorsOf, housekeeperData, NOW } from '../../../test/fixtures'
import { approveProfile, createHousekeeper, rejectProfile, validateHousekeeperData } from './Housekeeper'

describe('Housekeeper', () => {
  it('is created PENDING, awaiting agency validation', () => {
    expect(createHousekeeper(housekeeperData(), 'h1', NOW).status).toBe('PENDING')
  })

  it('removes duplicated skills and days', () => {
    const h = createHousekeeper(housekeeperData({ skills: ['CLEANING', 'CLEANING'], availability: ['MON', 'MON'] }), 'h1', NOW)
    expect(h.skills).toEqual(['CLEANING'])
    expect(h.availability).toEqual(['MON'])
  })

  it('must be at least 18 years old', () => {
    expect(validateHousekeeperData(housekeeperData({ birthDate: '2008-10-31' }), NOW).birthDate).toMatch(/18 anos/)
    expect(validateHousekeeperData(housekeeperData({ birthDate: '2008-10-30' }), NOW).birthDate).toBeUndefined()
  })

  it('expected salary cannot be below the minimum wage', () => {
    expect(validateHousekeeperData(housekeeperData({ expectedSalary: MINIMUM_WAGE_MZN - 1 }), NOW).expectedSalary).toBeDefined()
    expect(validateHousekeeperData(housekeeperData({ expectedSalary: Number.NaN }), NOW).expectedSalary).toBeDefined()
    expect(validateHousekeeperData(housekeeperData({ expectedSalary: MINIMUM_WAGE_MZN }), NOW).expectedSalary).toBeUndefined()
  })

  it('requires at least one skill and one available day', () => {
    const errors = fieldErrorsOf(() => createHousekeeper(housekeeperData({ skills: [], availability: [] }), 'h1', NOW))
    expect(errors).toHaveProperty('skills')
    expect(errors).toHaveProperty('availability')
  })

  it('experience must be an integer between 0 and 50', () => {
    expect(validateHousekeeperData(housekeeperData({ yearsOfExperience: 2.5 }), NOW).yearsOfExperience).toBeDefined()
    expect(validateHousekeeperData(housekeeperData({ yearsOfExperience: 51 }), NOW).yearsOfExperience).toBeDefined()
  })

  describe('profile review', () => {
    const pending = () => createHousekeeper(housekeeperData(), 'h1', NOW)

    it('approves a pending profile', () => {
      expect(approveProfile(pending()).status).toBe('APPROVED')
    })

    it('rejection requires a reason of at least 10 characters', () => {
      expect(fieldErrorsOf(() => rejectProfile(pending(), 'curto'))).toHaveProperty('reason')
      expect(rejectProfile(pending(), 'Documentos ilegíveis')).toMatchObject({ status: 'REJECTED', rejectionReason: 'Documentos ilegíveis' })
    })

    it('only pending profiles can be reviewed', () => {
      const approved = approveProfile(pending())
      expect(() => approveProfile(approved)).toThrow(BusinessRuleError)
      expect(() => rejectProfile(approved, 'Motivo suficientemente longo')).toThrow(BusinessRuleError)
    })
  })
})
