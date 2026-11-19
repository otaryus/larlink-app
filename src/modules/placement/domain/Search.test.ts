import { describe, expect, it } from 'vitest'
import { housekeeperData, NOW } from '../../../test/fixtures'
import { approveProfile, createHousekeeper, type Housekeeper } from '../../housekeepers/domain/Housekeeper'
import { matchesFilter, normalizeText, rankResults, validateSearchFilter } from './Search'

const approved = (id: string, overrides = {}): Housekeeper =>
  approveProfile(createHousekeeper(housekeeperData(overrides), id, NOW))

describe('Search', () => {
  it('never matches profiles not approved by the agency', () => {
    expect(matchesFilter(createHousekeeper(housekeeperData(), 'h1', NOW), {})).toBe(false)
    expect(matchesFilter(approved('h1'), {})).toBe(true)
  })

  it('matches ANY of the category skills', () => {
    const h = approved('h1')
    expect(matchesFilter(h, { skills: ['COOKING'] })).toBe(true)
    expect(matchesFilter(h, { skills: ['GARDENING', 'CLEANING'] })).toBe(true)
    expect(matchesFilter(h, { skills: ['CHILDCARE'] })).toBe(false)
    expect(matchesFilter(h, { skills: [] })).toBe(true)
  })

  it('filters by city, weekday and max salary', () => {
    const h = approved('h1')
    expect(matchesFilter(h, { city: 'Maputo' })).toBe(true)
    expect(matchesFilter(h, { city: 'Matola' })).toBe(false)
    expect(matchesFilter(h, { weekday: 'SUN' })).toBe(false)
    expect(matchesFilter(h, { maxSalary: 6999 })).toBe(false)
    expect(matchesFilter(h, { maxSalary: 7000 })).toBe(true)
  })

  it('free text matches name, neighborhood or skill label, ignoring accents and case', () => {
    const h = approved('h1', { skills: ['CHILDCARE'] })
    expect(matchesFilter(h, { text: 'rosa' })).toBe(true)
    expect(matchesFilter(h, { text: 'POLANA' })).toBe(true)
    expect(matchesFilter(h, { text: 'baba' })).toBe(true)
    expect(matchesFilter(h, { text: 'cozinha' })).toBe(false)
  })

  it('normalizes text', () => {
    expect(normalizeText('  Babá Conceição ')).toBe('baba conceicao')
  })

  it('rejects a max salary below minimum wage or non-positive', () => {
    expect(validateSearchFilter({ maxSalary: 100 })).toHaveProperty('maxSalary')
    expect(validateSearchFilter({ maxSalary: -1 })).toHaveProperty('maxSalary')
    expect(validateSearchFilter({ maxSalary: 8000 })).toEqual({})
    expect(validateSearchFilter({})).toEqual({})
  })

  it('ranks by number of reviews, then experience, then lower salary', () => {
    const ranked = rankResults(
      [
        approved('a', { yearsOfExperience: 2, expectedSalary: 6000 }),
        approved('b', { yearsOfExperience: 9, expectedSalary: 9000 }),
        approved('c', { yearsOfExperience: 9, expectedSalary: 7000 }),
        approved('d', { yearsOfExperience: 1 }),
      ],
      { d: 50 },
    )
    expect(ranked.map((h) => h.id)).toEqual(['d', 'c', 'b', 'a'])
  })
})
