import { describe, expect, it } from 'vitest'
import { BusinessRuleError } from '../../../shared/domain/errors'
import {
  createTestContainer,
  housekeeperData,
  seedActiveContract,
  seedClientAndApprovedHousekeeper,
  TODAY,
} from '../../../test/fixtures'
import type { SubmitHireRequestCommand } from './submitHireRequest'

const command = (clientId: string, housekeeperId: string): SubmitHireRequestCommand => ({
  clientId,
  housekeeperId,
  requiredSkills: ['CLEANING'],
  requiredDays: ['MON'],
  startDate: TODAY,
  notes: '',
})

describe('searchHousekeepers', () => {
  it('returns approved housekeepers ranked by number of reviews', async () => {
    const c = createTestContainer()
    const { housekeeper: first } = await seedClientAndApprovedHousekeeper(c)
    const second = await c.useCases.registerHousekeeper(housekeeperData({ name: 'Joana Cossa', phone: '871234567' }))
    await c.useCases.reviewProfile({ housekeeperId: second.id, decision: 'APPROVE' })
    await c.repositories.reviews.save({ id: 'v1', contractId: 'x', housekeeperId: second.id, clientId: 'c', rating: 5, comment: '', createdAt: '' })

    expect((await c.useCases.searchHousekeepers({})).map((h) => h.id)).toEqual([second.id, first.id])
  })

  it('excludes pending profiles and housekeepers with an active contract', async () => {
    const c = createTestContainer()
    await seedActiveContract(c)
    await c.useCases.registerHousekeeper(housekeeperData({ name: 'Joana Cossa', phone: '871234567' }))
    expect(await c.useCases.searchHousekeepers({})).toEqual([])
  })

  it('validates the filter', async () => {
    await expect(createTestContainer().useCases.searchHousekeepers({ maxSalary: 10 })).rejects.toThrow()
  })
})

describe('submitHireRequest', () => {
  it('creates a pending request', async () => {
    const c = createTestContainer()
    const { client, housekeeper } = await seedClientAndApprovedHousekeeper(c)
    const request = await c.useCases.submitHireRequest(command(client.id, housekeeper.id))
    expect(request.status).toBe('PENDING')
    expect(await c.repositories.hireRequests.findAll()).toHaveLength(1)
  })

  it('rejects a duplicated pending request from the same client', async () => {
    const c = createTestContainer()
    const { client, housekeeper } = await seedClientAndApprovedHousekeeper(c)
    await c.useCases.submitHireRequest(command(client.id, housekeeper.id))
    await expect(c.useCases.submitHireRequest(command(client.id, housekeeper.id))).rejects.toThrow(/pendente/)
  })

  it('rejects unknown client or housekeeper', async () => {
    const c = createTestContainer()
    const { client, housekeeper } = await seedClientAndApprovedHousekeeper(c)
    await expect(c.useCases.submitHireRequest(command('nope', housekeeper.id))).rejects.toThrow(/Cliente/)
    await expect(c.useCases.submitHireRequest(command(client.id, 'nope'))).rejects.toThrow(/Empregada/)
  })

  it('rejects a housekeeper who already has an active contract', async () => {
    const c = createTestContainer()
    const { client, housekeeper } = await seedActiveContract(c)
    await expect(c.useCases.submitHireRequest(command(client.id, housekeeper.id))).rejects.toThrow(/contrato activo/)
  })
})

describe('decideHireRequest', () => {
  it('approves, rejects and cancels pending requests', async () => {
    const c = createTestContainer()
    const { client, housekeeper } = await seedClientAndApprovedHousekeeper(c)
    const r1 = await c.useCases.submitHireRequest(command(client.id, housekeeper.id))
    expect((await c.useCases.decideHireRequest({ hireRequestId: r1.id, decision: 'CANCEL' })).status).toBe('CANCELLED')
    const r2 = await c.useCases.submitHireRequest(command(client.id, housekeeper.id))
    expect((await c.useCases.decideHireRequest({ hireRequestId: r2.id, decision: 'REJECT', reason: 'Horário incompatível' })).status).toBe('REJECTED')
    const r3 = await c.useCases.submitHireRequest(command(client.id, housekeeper.id))
    expect((await c.useCases.decideHireRequest({ hireRequestId: r3.id, decision: 'APPROVE' })).status).toBe('APPROVED')
  })

  it('cannot approve while the housekeeper has an active contract', async () => {
    const c = createTestContainer()
    const { housekeeper } = await seedActiveContract(c)
    const other = await c.useCases.registerClient({ name: 'Carlos Sitoe', email: 'carlos@exemplo.co.mz', phone: '821234567', address: 'Rua da Sé, 45' })
    await c.repositories.hireRequests.save({ ...command(other.id, housekeeper.id), id: 'r-x', status: 'PENDING', createdAt: '' })
    await expect(c.useCases.decideHireRequest({ hireRequestId: 'r-x', decision: 'APPROVE' })).rejects.toBeInstanceOf(BusinessRuleError)
  })
})
