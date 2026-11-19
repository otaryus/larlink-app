import type { FieldErrors } from '../../../shared/domain/errors'
import { MINIMUM_WAGE_MZN } from '../../../shared/domain/policies'
import { SKILLS, type Housekeeper, type Skill, type Weekday } from '../../housekeepers/domain/Housekeeper'

export interface SearchFilter {
  text?: string
  city?: string
  skills?: Skill[]
  weekday?: Weekday
  maxSalary?: number
}

export function validateSearchFilter(filter: SearchFilter): FieldErrors {
  const errors: FieldErrors = {}
  if (filter.maxSalary !== undefined) {
    if (!Number.isFinite(filter.maxSalary) || filter.maxSalary <= 0)
      errors.maxSalary = 'Indique um valor positivo.'
    else if (filter.maxSalary < MINIMUM_WAGE_MZN)
      errors.maxSalary = `Nenhum perfil aceita menos que o salário mínimo (${MINIMUM_WAGE_MZN} MZN).`
  }
  return errors
}

export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

export function matchesFilter(housekeeper: Housekeeper, filter: SearchFilter): boolean {
  if (housekeeper.status !== 'APPROVED') return false
  if (filter.city && housekeeper.city !== filter.city) return false
  if (filter.skills?.length && !filter.skills.some((s) => housekeeper.skills.includes(s))) return false
  if (filter.weekday && !housekeeper.availability.includes(filter.weekday)) return false
  if (filter.maxSalary !== undefined && housekeeper.expectedSalary > filter.maxSalary) return false
  const text = normalizeText(filter.text ?? '')
  if (text) {
    const haystack = normalizeText(
      [housekeeper.name, housekeeper.neighborhood, ...housekeeper.skills.map((s) => SKILLS[s])].join(' '),
    )
    if (!haystack.includes(text)) return false
  }
  return true
}

export function rankResults(housekeepers: Housekeeper[], reviewCounts: Record<string, number> = {}): Housekeeper[] {
  return [...housekeepers].sort(
    (a, b) =>
      (reviewCounts[b.id] ?? 0) - (reviewCounts[a.id] ?? 0) ||
      b.yearsOfExperience - a.yearsOfExperience ||
      a.expectedSalary - b.expectedSalary,
  )
}
