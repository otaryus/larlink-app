import { describe, expect, it } from 'vitest'
import type { HireRequest } from './HireRequest'
import { availabilityOf, recentPlacements, stageOf, type ContractSnapshot } from './PlacementStatus'

const request = (id: string, status: HireRequest['status'], createdAt = '2026-10-01T00:00:00Z'): HireRequest => ({
  id,
  clientId: 'c1',
  housekeeperId: 'h1',
  requiredSkills: ['CLEANING'],
  requiredDays: ['MON'],
  startDate: '2026-10-01',
  notes: '',
  status,
  createdAt,
})
const contract = (hireRequestId: string, status: ContractSnapshot['status'], extra: Partial<ContractSnapshot> = {}): ContractSnapshot => ({
  hireRequestId,
  housekeeperId: 'h1',
  status,
  createdAt: '2026-10-05T00:00:00Z',
  ...extra,
})

describe('availabilityOf', () => {
  it('is AVAILABLE without open requests or active contracts', () => {
    expect(availabilityOf('h1', [request('r1', 'REJECTED')], [])).toBe('AVAILABLE')
  })

  it('is IN_PLACEMENT while a request is pending or approved without contract', () => {
    expect(availabilityOf('h1', [request('r1', 'PENDING')], [])).toBe('IN_PLACEMENT')
    expect(availabilityOf('h1', [request('r1', 'APPROVED')], [])).toBe('IN_PLACEMENT')
  })

  it('is HIRED with an active contract and AVAILABLE again once it ends', () => {
    expect(availabilityOf('h1', [request('r1', 'APPROVED')], [contract('r1', 'ACTIVE')])).toBe('HIRED')
    expect(availabilityOf('h1', [request('r1', 'APPROVED')], [contract('r1', 'TERMINATED')])).toBe('AVAILABLE')
  })

  it('only considers the given housekeeper', () => {
    expect(availabilityOf('h2', [request('r1', 'PENDING')], [contract('r1', 'ACTIVE')])).toBe('AVAILABLE')
  })
})

describe('stageOf', () => {
  it('maps request/contract state to the placement stage', () => {
    expect(stageOf(request('r', 'PENDING'))).toBe('NEW_REQUEST')
    expect(stageOf(request('r', 'APPROVED'))).toBe('IN_PROGRESS')
    expect(stageOf(request('r', 'APPROVED'), contract('r', 'ACTIVE'))).toBe('CONTRACT_SIGNED')
    expect(stageOf(request('r', 'APPROVED'), contract('r', 'TERMINATED'))).toBe('COMPLETED')
    expect(stageOf(request('r', 'REJECTED'))).toBe('CLOSED')
    expect(stageOf(request('r', 'CANCELLED'))).toBe('CLOSED')
  })
})

describe('recentPlacements', () => {
  it('orders by latest event (termination > contract > request)', () => {
    const rows = recentPlacements(
      [request('old', 'PENDING', '2026-10-02T00:00:00Z'), request('signed', 'APPROVED'), request('done', 'APPROVED')],
      [contract('signed', 'ACTIVE'), contract('done', 'TERMINATED', { terminatedAt: '2026-10-20T00:00:00Z' })],
    )
    expect(rows.map((r) => [r.request.id, r.stage])).toEqual([
      ['done', 'COMPLETED'],
      ['signed', 'CONTRACT_SIGNED'],
      ['old', 'NEW_REQUEST'],
    ])
  })
})
