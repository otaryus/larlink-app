import { throwIfErrors, type FieldErrors } from '../../../shared/domain/errors'
import { isValidEmail, isValidFullName } from '../../../shared/domain/validators'

export const ROLES = {
  AGENCY: 'Agente da agência',
  SECRETARY: 'Secretária da agência',
  CLIENT: 'Cliente',
  HOUSEKEEPER: 'Empregada',
  CANDIDATE: 'Candidata',
} as const
export type Role = keyof typeof ROLES

export interface Account {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly role: Role
  readonly passwordHash: string
  readonly createdAt: string
}

export interface RegistrationData {
  name: string
  email: string
  role: string
  password: string
  passwordConfirmation: string
  acceptTerms: boolean
  photo?: File | null
}

export interface Credentials {
  email: string
  password: string
}

export const MIN_PASSWORD_LENGTH = 8

export const PASSWORD_RULES = [
  { label: `Pelo menos ${MIN_PASSWORD_LENGTH} caracteres`, test: (p: string) => p.length >= MIN_PASSWORD_LENGTH },
  { label: 'Uma letra', test: (p: string) => /\p{L}/u.test(p) },
  { label: 'Um número', test: (p: string) => /\d/.test(p) },
  { label: 'Um símbolo (ex.: @ # !)', test: (p: string) => /[^\p{L}\d\s]/u.test(p) },
] as const

export function isStrongPassword(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password))
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function validateRegistration(data: RegistrationData): FieldErrors {
  const errors: FieldErrors = {}
  if (!isValidFullName(data.name)) errors.name = 'Indique o nome completo (nome e apelido).'
  if (!isValidEmail(data.email)) errors.email = 'Email inválido.'
  if (!(data.role in ROLES)) errors.role = 'Seleccione o tipo de conta.'
  if (!isStrongPassword(data.password))
    errors.password = 'A palavra-passe deve ter 8+ caracteres, com letra, número e símbolo.'
  if (!data.passwordConfirmation) errors.passwordConfirmation = 'Confirme a palavra-passe.'
  else if (data.passwordConfirmation !== data.password)
    errors.passwordConfirmation = 'As palavras-passe não coincidem.'
  if (!data.acceptTerms) errors.acceptTerms = 'Tem de aceitar os termos de utilização.'
  return errors
}

export function validateCredentials(data: Credentials): FieldErrors {
  const errors: FieldErrors = {}
  if (!data.email.trim()) errors.email = 'Indique o email.'
  else if (!isValidEmail(data.email)) errors.email = 'Email inválido.'
  if (!data.password) errors.password = 'Indique a palavra-passe.'
  return errors
}

export function createAccount(data: RegistrationData, passwordHash: string, id: string, now: Date): Account {
  throwIfErrors(validateRegistration(data))
  return {
    id,
    name: data.name.trim(),
    email: normalizeEmail(data.email),
    role: data.role as Role,
    passwordHash,
    createdAt: now.toISOString(),
  }
}

export interface Session {
  accountId: string
  name: string
  email: string
  role: Role
  signedInAt: string
  mustChangePassword?: boolean
}

export function startSession(account: Account, now: Date): Session {
  return { accountId: account.id, name: account.name, email: account.email, role: account.role, signedInAt: now.toISOString() }
}
