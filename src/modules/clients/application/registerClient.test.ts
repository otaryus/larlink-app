import { describe, expect, it } from 'vitest'
import { ValidationError } from '../../../shared/domain/errors'
import { clientData, createTestContainer } from '../../../test/fixtures'

describe('registerClient', () => {
  it('persists a valid client', async () => {
    const c = createTestContainer()
    const client = await c.useCases.registerClient(clientData())
    expect(await c.repositories.clients.findById(client.id)).toEqual(client)
  })

  it('rejects a duplicated email (case-insensitive)', async () => {
    const c = createTestContainer()
    await c.useCases.registerClient(clientData())
    await expect(c.useCases.registerClient(clientData({ email: 'ANA@exemplo.co.mz' }))).rejects.toBeInstanceOf(ValidationError)
    expect(await c.repositories.clients.findAll()).toHaveLength(1)
  })

  it('does not persist invalid data', async () => {
    const c = createTestContainer()
    await expect(c.useCases.registerClient(clientData({ phone: '000' }))).rejects.toBeInstanceOf(ValidationError)
    expect(await c.repositories.clients.findAll()).toHaveLength(0)
  })
})
