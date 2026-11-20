import { ageAt, isValidDate } from '../../../shared/domain/dates'
import { throwIfErrors, type FieldErrors } from '../../../shared/domain/errors'
import { MIN_HOUSEKEEPER_AGE, MINIMUM_WAGE_MZN } from '../../../shared/domain/policies'
import { isIntegerBetween, isValidPhone, normalizePhone } from '../../../shared/domain/validators'
import { CITIES } from '../../housekeepers/domain/Housekeeper'
import type {
  ClientProfile,
  OwnProfile,
  WorkerProfileDraft,
} from '../domain/Profile'
import type { ProfileRepository } from '../ports/ProfileRepository'

export type ProfileKind = 'worker' | 'client'

export function makeLoadProfile(repository: ProfileRepository) {
  return async function loadProfile(kind: ProfileKind): Promise<OwnProfile> {
    return kind === 'worker' ? repository.loadWorker() : repository.loadClient()
  }
}

export type SaveProfileCommand =
  | { kind: 'worker'; profile: WorkerProfileDraft }
  | { kind: 'client'; profile: ClientProfile }

function validateClientProfile(profile: ClientProfile): FieldErrors {
  const errors: FieldErrors = {}
  if (!isValidPhone(profile.phone)) errors.phone = 'Indique um telemóvel moçambicano válido.'
  if (profile.address.trim().length < 5 || profile.address.trim().length > 500)
    errors.address = 'O endereço deve ter entre 5 e 500 caracteres.'
  return errors
}

function validateWorkerProfile(profile: WorkerProfileDraft, now: Date): FieldErrors {
  const errors: FieldErrors = {}
  if (!isValidDate(profile.birthDate)) errors.birthDate = 'Indique uma data de nascimento válida.'
  else if (ageAt(profile.birthDate, now) < MIN_HOUSEKEEPER_AGE)
    errors.birthDate = `A trabalhadora deve ter pelo menos ${MIN_HOUSEKEEPER_AGE} anos.`
  if (!isValidPhone(profile.phone)) errors.phone = 'Indique um telemóvel moçambicano válido.'
  if (!CITIES.includes(profile.city as (typeof CITIES)[number])) errors.city = 'Seleccione uma cidade válida.'
  if (profile.neighborhood.trim().length < 3 || profile.neighborhood.trim().length > 100)
    errors.neighborhood = 'O bairro deve ter entre 3 e 100 caracteres.'
  if (profile.skills.length === 0) errors.skills = 'Seleccione pelo menos uma competência.'
  if (profile.availability.length === 0) errors.availability = 'Seleccione pelo menos um dia disponível.'

  const expectedSalary = Number(profile.expectedSalary)
  if (!Number.isInteger(expectedSalary) || expectedSalary < MINIMUM_WAGE_MZN || expectedSalary % 50 !== 0)
    errors.expectedSalary = `O salário deve ser igual ou superior a ${MINIMUM_WAGE_MZN} MT e múltiplo de 50.`

  const yearsOfExperience = Number(profile.yearsOfExperience)
  if (!isIntegerBetween(yearsOfExperience, 0, 50))
    errors.yearsOfExperience = 'A experiência deve ser um número inteiro entre 0 e 50.'
  return errors
}

export function makeSaveProfile(repository: ProfileRepository) {
  return async function saveProfile(command: SaveProfileCommand): Promise<void> {
    if (command.kind === 'client') {
      throwIfErrors(validateClientProfile(command.profile))
      await repository.saveClient({
        ...command.profile,
        phone: normalizePhone(command.profile.phone),
        address: command.profile.address.trim(),
      })
      return
    }

    throwIfErrors(validateWorkerProfile(command.profile, new Date()))
    await repository.saveWorker({
      ...command.profile,
      phone: normalizePhone(command.profile.phone),
      neighborhood: command.profile.neighborhood.trim(),
      expectedSalary: Number(command.profile.expectedSalary),
      yearsOfExperience: Number(command.profile.yearsOfExperience),
    })
  }
}
