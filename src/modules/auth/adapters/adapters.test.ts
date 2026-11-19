import { beforeEach, describe, expect, it } from 'vitest'
import { Sha256PasswordHasher } from './Sha256PasswordHasher'
import { InMemorySessionStore, LocalStorageSessionStore } from './sessionStores'

const session = { accountId: 'a1', name: 'Ana Machava', email: 'ana@exemplo.co.mz', role: 'CLIENT' as const, signedInAt: '2026-10-30T10:00:00Z' }

describe('Sha256PasswordHasher', () => {
  const hasher = new Sha256PasswordHasher()

  it('verifies the right password only', async () => {
    const hash = await hasher.hash('Segura@123')
    expect(hash).not.toContain('Segura@123')
    expect(await hasher.verify('Segura@123', hash)).toBe(true)
    expect(await hasher.verify('segura123', hash)).toBe(false)
  })

  it('salts every hash', async () => {
    expect(await hasher.hash('Segura@123')).not.toBe(await hasher.hash('Segura@123'))
  })

  it('rejects malformed hashes', async () => {
    expect(await hasher.verify('x', 'sem-separador')).toBe(false)
  })
})

describe('session stores', () => {
  beforeEach(() => localStorage.clear())

  it.each([
    ['memory', () => new InMemorySessionStore()],
    ['localStorage', () => new LocalStorageSessionStore('test.session', localStorage)],
  ])('%s: save, load and clear', (_, make) => {
    const store = make()
    expect(store.load()).toBeNull()
    store.save(session)
    expect(store.load()).toEqual(session)
    store.clear()
    expect(store.load()).toBeNull()
  })

  it('localStorage store survives a new instance and ignores corrupted data', () => {
    new LocalStorageSessionStore('test.session', localStorage).save(session)
    expect(new LocalStorageSessionStore('test.session', localStorage).load()).toEqual(session)
    localStorage.setItem('test.session', '{corrompido')
    expect(new LocalStorageSessionStore('test.session', localStorage).load()).toBeNull()
  })
})
