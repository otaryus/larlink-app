import { ageAt, isValidDate } from '../../../shared/domain/dates'
import {
  BusinessRuleError,
  ValidationError,
  throwIfErrors,
  type FieldErrors,
} from '../../../shared/domain/errors'
import {
  MIN_HOUSEKEEPER_AGE,
  MIN_REASON_LENGTH,
  MINIMUM_WAGE_MZN,
} from '../../../shared/domain/policies'
import {
  isIntegerBetween,
  isValidFullName,
  isValidPhone,
  normalizePhone,
} from '../../../shared/domain/validators'

export const SKILLS = {
  CLEANING: 'Limpeza',
  COOKING: 'Cozinha',
  CHILDCARE: 'Babá',
  ELDERLY_CARE: 'Cuidados',
  LAUNDRY: 'Lavandaria',
  GARDENING: 'Jardinagem',
  OTHER: 'Outras actividades',
} as const
export type Skill = keyof typeof SKILLS

export const WEEKDAYS = {
  MON: 'Segunda',
  TUE: 'Terça',
  WED: 'Quarta',
  THU: 'Quinta',
  FRI: 'Sexta',
  SAT: 'Sábado',
  SUN: 'Domingo',
} as const
export type Weekday = keyof typeof WEEKDAYS

export const CITIES = ['Maputo', 'Matola', 'Beira', 'Nampula', 'Xai-Xai', 'Inhambane'] as const
export type City = (typeof CITIES)[number]

export type ProfileStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Housekeeper {
  readonly id: string
  readonly name: string
  readonly birthDate: string
  readonly phone: string
  readonly city: City
  readonly neighborhood: string
  readonly skills: Skill[]
  readonly availability: Weekday[]
  readonly expectedSalary: number
  readonly yearsOfExperience: number
  readonly status: ProfileStatus
  readonly rejectionReason?: string
  readonly createdAt: string
}

export type HousekeeperData = Pick<
  Housekeeper,
  | 'name'
  | 'birthDate'
  | 'phone'
  | 'city'
  | 'neighborhood'
  | 'skills'
  | 'availability'
  | 'expectedSalary'
  | 'yearsOfExperience'
>

export function validateHousekeeperData(data: HousekeeperData, now: Date): FieldErrors {
  const errors: FieldErrors = {}
  if (!isValidFullName(data.name)) errors.name = 'Indique o nome completo (nome e apelido).'
  if (!isValidDate(data.birthDate)) errors.birthDate = 'Data de nascimento inválida.'
  else if (ageAt(data.birthDate, now) < MIN_HOUSEKEEPER_AGE)
    errors.birthDate = `A empregada deve ter pelo menos ${MIN_HOUSEKEEPER_AGE} anos.`
  if (!isValidPhone(data.phone)) errors.phone = 'Telemóvel moçambicano inválido (ex.: 84 123 4567).'
  if (!CITIES.includes(data.city)) errors.city = 'Seleccione a cidade.'
  if (data.neighborhood.trim().length < 3) errors.neighborhood = 'Indique o bairro.'
  if (data.skills.length === 0) errors.skills = 'Seleccione pelo menos uma competência.'
  if (data.availability.length === 0) errors.availability = 'Seleccione pelo menos um dia disponível.'
  if (!Number.isFinite(data.expectedSalary) || data.expectedSalary < MINIMUM_WAGE_MZN)
    errors.expectedSalary = `O salário pretendido não pode ser inferior a ${MINIMUM_WAGE_MZN} MZN.`
  if (!isIntegerBetween(data.yearsOfExperience, 0, 50))
    errors.yearsOfExperience = 'Experiência deve ser um número inteiro entre 0 e 50.'
  return errors
}

export function createHousekeeper(data: HousekeeperData, id: string, now: Date): Housekeeper {
  throwIfErrors(validateHousekeeperData(data, now))
  return {
    id,
    name: data.name.trim(),
    birthDate: data.birthDate,
    phone: normalizePhone(data.phone),
    city: data.city,
    neighborhood: data.neighborhood.trim(),
    skills: [...new Set(data.skills)],
    availability: [...new Set(data.availability)],
    expectedSalary: data.expectedSalary,
    yearsOfExperience: data.yearsOfExperience,
    status: 'PENDING',
    createdAt: now.toISOString(),
  }
}

function requirePending(housekeeper: Housekeeper): void {
  if (housekeeper.status !== 'PENDING')
    throw new BusinessRuleError('Apenas perfis pendentes podem ser avaliados pelo gestor.')
}

export function approveProfile(housekeeper: Housekeeper): Housekeeper {
  requirePending(housekeeper)
  return { ...housekeeper, status: 'APPROVED' }
}

export function rejectProfile(housekeeper: Housekeeper, reason: string): Housekeeper {
  requirePending(housekeeper)
  if (reason.trim().length < MIN_REASON_LENGTH)
    throw new ValidationError({ reason: `Indique o motivo (mín. ${MIN_REASON_LENGTH} caracteres).` })
  return { ...housekeeper, status: 'REJECTED', rejectionReason: reason.trim() }
}
