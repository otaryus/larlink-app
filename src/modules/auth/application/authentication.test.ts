import { describe, expect, it } from 'vitest'
import { BusinessRuleError, ValidationError } from '../../../shared/domain/errors'
import { createTestContainer, registrationData } from '../../../test/fixtures'
import { INVALID_CREDENTIALS } from './authentication'

describe('registerAccount', () => {
  it('stores a hashed account and starts a session', async () => {
    const c = createTestContainer()
    const session = await c.useCases.registerAccount(registrationData())
    const [account] = await c.repositories.accounts.findAll()
    expect(account.passwordHash).not.toBe('Segura@123')
    expect(session).toMatchObject({ accountId: account.id, name: 'Carla Nhantumbo', role: 'CLIENT' })
    expect(c.useCases.getSession()).toEqual(session)
  })

  it('rejects an email already registered (case-insensitive)', async () => {
    const c = createTestContainer()
    await c.useCases.registerAccount(registrationData())
    await expect(c.useCases.registerAccount(registrationData({ email: 'CARLA@exemplo.co.mz' }))).rejects.toMatchObject({
      fields: { email: 'Já existe uma conta com este email.' },
    })
  })

  it('does not store anything when data is invalid', async () => {
    const c = createTestContainer()
    await expect(c.useCases.registerAccount(registrationData({ password: 'fraca', passwordConfirmation: 'fraca' }))).rejects.toBeInstanceOf(ValidationError)
    expect(await c.repositories.accounts.findAll()).toHaveLength(0)
    expect(c.useCases.getSession()).toBeNull()
  })
})

describe('signIn / signOut', () => {
  async function withAccount() {
    const c = createTestContainer()
    await c.useCases.registerAccount(registrationData())
    c.useCases.signOut()
    return c
  }

  it('signs in with the right credentials (email is case-insensitive)', async () => {
    const c = await withAccount()
    const session = await c.useCases.signIn({ email: ' Carla@exemplo.co.mz', password: 'Segura@123' })
    expect(session.email).toBe('carla@exemplo.co.mz')
    expect(c.useCases.getSession()).toEqual(session)
  })

  it('uses the same generic message for wrong password and unknown email', async () => {
    const c = await withAccount()
    await expect(c.useCases.signIn({ email: 'carla@exemplo.co.mz', password: 'Errada@123' })).rejects.toThrow(INVALID_CREDENTIALS)
    await expect(c.useCases.signIn({ email: 'ninguem@exemplo.co.mz', password: 'Segura@123' })).rejects.toThrow(INVALID_CREDENTIALS)
    await expect(c.useCases.signIn({ email: 'ninguem@exemplo.co.mz', password: 'x' })).rejects.toBeInstanceOf(BusinessRuleError)
    expect(c.useCases.getSession()).toBeNull()
  })

  it('validates required fields before checking credentials', async () => {
    await expect((await withAccount()).useCases.signIn({ email: '', password: '' })).rejects.toBeInstanceOf(ValidationError)
  })

  it('signOut clears the session', async () => {
    const c = await withAccount()
    await c.useCases.signIn({ email: 'carla@exemplo.co.mz', password: 'Segura@123' })
    c.useCases.signOut()
    expect(c.useCases.getSession()).toBeNull()
  })
})
