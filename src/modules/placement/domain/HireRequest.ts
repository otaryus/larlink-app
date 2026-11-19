import { isValidDate, toISODate } from '../../../shared/domain/dates'
import {
  BusinessRuleError,
  ValidationError,
  throwIfErrors,
  type FieldErrors,
} from '../../../shared/domain/errors'
import { MIN_REASON_LENGTH } from '../../../shared/domain/policies'
import type { Housekeeper, Skill, Weekday } from '../../housekeepers/domain/Housekeeper'

export type HireRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface HireRequest {
  readonly id: string
  readonly clientId: string
  readonly housekeeperId: string
  readonly requiredSkills: Skill[]
  readonly requiredDays: Weekday[]
  readonly startDate: string
  readonly notes: string
  readonly status: HireRequestStatus
  readonly rejectionReason?: string
  readonly createdAt: string
}

export type HireRequestData = Pick<
  HireRequest,
  'clientId' | 'housekeeperId' | 'requiredSkills' | 'requiredDays' | 'startDate' | 'notes'
>

export const MAX_NOTES_LENGTH = 300

export function validateHireRequestData(
  data: HireRequestData,
  housekeeper: Housekeeper,
  now: Date,
): FieldErrors {
  const errors: FieldErrors = {}
  if (!data.clientId) errors.clientId = 'Seleccione o cliente.'
  if (data.requiredSkills.length === 0) errors.requiredSkills = 'Seleccione pelo menos um serviço.'
  else if (data.requiredSkills.some((s) => !housekeeper.skills.includes(s)))
    errors.requiredSkills = 'A empregada não possui todas as competências pedidas.'
  if (data.requiredDays.length === 0) errors.requiredDays = 'Seleccione pelo menos um dia.'
  else if (data.requiredDays.some((d) => !housekeeper.availability.includes(d)))
    errors.requiredDays = 'A empregada não está disponível em todos os dias pedidos.'
  if (!isValidDate(data.startDate)) errors.startDate = 'Data de início inválida.'
  else if (data.startDate < toISODate(now))
    errors.startDate = 'A data de início não pode estar no passado.'
  if (data.notes.length > MAX_NOTES_LENGTH) errors.notes = `Máximo de ${MAX_NOTES_LENGTH} caracteres.`
  return errors
}

export function createHireRequest(
  data: HireRequestData,
  housekeeper: Housekeeper,
  id: string,
  now: Date,
): HireRequest {
  if (housekeeper.status !== 'APPROVED')
    throw new BusinessRuleError('Só é possível solicitar empregadas com perfil aprovado.')
  throwIfErrors(validateHireRequestData(data, housekeeper, now))
  return { id, ...data, notes: data.notes.trim(), status: 'PENDING', createdAt: now.toISOString() }
}

function requirePending(request: HireRequest): void {
  if (request.status !== 'PENDING')
    throw new BusinessRuleError('Apenas pedidos pendentes podem ser alterados.')
}

export function approveHireRequest(request: HireRequest): HireRequest {
  requirePending(request)
  return { ...request, status: 'APPROVED' }
}

export function rejectHireRequest(request: HireRequest, reason: string): HireRequest {
  requirePending(request)
  if (reason.trim().length < MIN_REASON_LENGTH)
    throw new ValidationError({ reason: `Indique o motivo (mín. ${MIN_REASON_LENGTH} caracteres).` })
  return { ...request, status: 'REJECTED', rejectionReason: reason.trim() }
}

export function cancelHireRequest(request: HireRequest): HireRequest {
  requirePending(request)
  return { ...request, status: 'CANCELLED' }
}
