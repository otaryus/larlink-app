import { BusinessRuleError, ValidationError, throwIfErrors } from '../../../shared/domain/errors'
import type { Clock, IdGenerator } from '../../../shared/ports/services'
import {
  createAccount,
  normalizeEmail,
  startSession,
  validateCredentials,
  validateRegistration,
  type Credentials,
  type RegistrationData,
  type Session,
} from '../domain/Account'
import type { AccountRepository } from '../ports/AccountRepository'
import type { PasswordHasher } from '../ports/PasswordHasher'
import type { SessionStore } from '../ports/SessionStore'

export type RegisterAccountCommand = RegistrationData
export type SignInCommand = Credentials

export interface AuthDeps {
  accounts: AccountRepository
  passwordHasher: PasswordHasher
  sessionStore: SessionStore
  generateId: IdGenerator
  now: Clock
}

export function makeRegisterAccount({ accounts, passwordHasher, sessionStore, generateId, now }: AuthDeps) {
  return async function registerAccount(command: RegisterAccountCommand): Promise<Session> {
    throwIfErrors(validateRegistration(command))
    const email = normalizeEmail(command.email)
    if ((await accounts.findAll()).some((a) => a.email === email))
      throw new ValidationError({ email: 'Já existe uma conta com este email.' })
    const account = createAccount(command, await passwordHasher.hash(command.password), generateId(), now())
    await accounts.save(account)
    const session = startSession(account, now())
    sessionStore.save(session)
    return session
  }
}

export const INVALID_CREDENTIALS = 'Email ou palavra-passe incorrectos.'

export function makeSignIn({ accounts, passwordHasher, sessionStore, now }: AuthDeps) {
  return async function signIn(command: SignInCommand): Promise<Session> {
    throwIfErrors(validateCredentials(command))
    const email = normalizeEmail(command.email)
    const account = (await accounts.findAll()).find((a) => a.email === email)
    if (!account || !(await passwordHasher.verify(command.password, account.passwordHash)))
      throw new BusinessRuleError(INVALID_CREDENTIALS)
    const session = startSession(account, now())
    sessionStore.save(session)
    return session
  }
}

export function makeSignOut({ sessionStore }: Pick<AuthDeps, 'sessionStore'>) {
  return function signOut(): void {
    sessionStore.clear()
  }
}

export function makeGetSession({ sessionStore }: Pick<AuthDeps, 'sessionStore'>) {
  return function getSession(): Session | null {
    return sessionStore.load()
  }
}
