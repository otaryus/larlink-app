import { describe, expect, it } from 'vitest'
import { fieldErrorsOf, NOW, registrationData } from '../../../test/fixtures'
import {
  createAccount,
  isStrongPassword,
  PASSWORD_RULES,
  startSession,
  validateCredentials,
  validateRegistration,
} from './Account'

describe('Account — registration rules', () => {
  it('accepts valid data', () => {
    expect(validateRegistration(registrationData())).toEqual({})
  })

  it.each([
    ['cur@1', false],
    ['semsimbolo123', false],
    ['semnumero@abc', false],
    ['12345678@', false],
    ['teste@123', true],
    ['Çidade#2026', true],
  ])('password %s strong? %s', (password, expected) => {
    expect(isStrongPassword(password)).toBe(expected)
  })

  it('exposes each password rule for the live checklist', () => {
    expect(PASSWORD_RULES.map((r) => r.test('abc'))).toEqual([false, true, false, false])
  })

  it('reports every invalid field', () => {
    const errors = validateRegistration({ name: 'Ana', email: 'x', role: 'ADMIN', password: 'fraca', passwordConfirmation: '', acceptTerms: false })
    expect(Object.keys(errors).sort()).toEqual(['acceptTerms', 'email', 'name', 'password', 'passwordConfirmation', 'role'])
  })

  it('confirmation must match the password', () => {
    expect(validateRegistration(registrationData({ passwordConfirmation: 'Segura@124' })).passwordConfirmation).toBe('As palavras-passe não coincidem.')
  })

  it('creates the account with normalized email and without the plain password', () => {
    const account = createAccount(registrationData({ email: ' Carla@Exemplo.CO.MZ ' }), 'hash', 'a1', NOW)
    expect(account).toEqual({ id: 'a1', name: 'Carla Nhantumbo', email: 'carla@exemplo.co.mz', role: 'CLIENT', passwordHash: 'hash', createdAt: NOW.toISOString() })
    expect(JSON.stringify(account)).not.toContain('Segura@123')
  })

  it('refuses to create an invalid account', () => {
    expect(fieldErrorsOf(() => createAccount(registrationData({ acceptTerms: false }), 'h', 'a1', NOW))).toHaveProperty('acceptTerms')
  })
})

describe('Account — sign in rules', () => {
  it('requires email and password', () => {
    expect(validateCredentials({ email: '', password: '' })).toEqual({ email: 'Indique o email.', password: 'Indique a palavra-passe.' })
    expect(validateCredentials({ email: 'nao-e-email', password: 'x' })).toEqual({ email: 'Email inválido.' })
  })

  it('session carries identity, never the hash', () => {
    const session = startSession(createAccount(registrationData(), 'secret-hash', 'a1', NOW), NOW)
    expect(session).toEqual({ accountId: 'a1', name: 'Carla Nhantumbo', email: 'carla@exemplo.co.mz', role: 'CLIENT', signedInAt: NOW.toISOString() })
  })
})
