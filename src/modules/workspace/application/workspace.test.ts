import { describe, expect, it, vi } from 'vitest'
import type { WorkspaceWorker } from '../domain/Workspace'
import type { WorkspaceApi } from '../ports/WorkspaceApi'
import {
  makeLoadOperations,
  makeLoadRoleHome,
  makeWorkspaceActions,
  makeSaveClientProfile,
  makeSaveWorkerProfile,
  makeSearchMatching,
} from './workspace'

function workspaceApi(respond: (path: string) => unknown): WorkspaceApi {
  return {
    request: vi.fn(async (path: string) => respond(path)) as WorkspaceApi['request'],
    download: vi.fn(async () => {}),
    findMatches: vi.fn(async () => []),
    saveClientProfile: vi.fn(async () => {}),
    saveWorkerProfile: vi.fn(async () => ({ id: 'worker-1' } as WorkspaceWorker)),
    saveWorkerPhoto: vi.fn(async () => {}),
  }
}

describe('role workspace queries', () => {
  it('loads the candidate inbox, contracts and profile proposals', async () => {
    const api = workspaceApi((path) => {
      if (path === '/api/housekeepers/me') return { id: 'worker-1', city: 'Maputo' }
      if (path === '/api/requests/inbox') return [{ id: 'request-1' }]
      if (path === '/api/contracts') return [{ id: 'contract-1' }]
      if (path === '/api/requests/request-1/proposals') return [{ id: 'proposal-1' }]
      return []
    })

    const result = await makeLoadRoleHome(api)({ role: 'CANDIDATE', pathname: '/perfil' })

    expect(result.worker).toMatchObject({ id: 'worker-1' })
    expect(result.workerRequests).toEqual([{ id: 'request-1' }])
    expect(result.contractsList).toEqual([{ id: 'contract-1' }])
    expect(result.workerProposalRows).toEqual([
      { request: { id: 'request-1' }, proposals: [{ id: 'proposal-1' }] },
    ])
    expect(api.request).toHaveBeenCalledWith('/api/requests/request-1/proposals')
  })

  it('treats a missing client profile as an onboarding state', async () => {
    const api = workspaceApi((path) => {
      if (path === '/api/clients/me') throw new Error('Perfil em falta (404).')
      return []
    })

    await expect(makeLoadRoleHome(api)({ role: 'CLIENT', pathname: '/' })).resolves.toMatchObject({
      client: null,
      requests: [],
    })
  })
})

describe('operations workspace queries', () => {
  it('builds the filtered report URL and loads contracts alongside it', async () => {
    const api = workspaceApi((path) => path.startsWith('/api/agent/reports?') ? { count: 2 } : [])
    const load = makeLoadOperations(api)

    const result = await load({
      pathname: '/relatorios',
      role: 'AGENCY',
      reportFilters: { from: '2026-01-01', to: '', contractId: 'contract 1', clientId: '', workerId: '' },
    })

    expect(result.rows).toEqual([{ count: 2 }])
    expect(result.contracts).toEqual([])
    expect(api.request).toHaveBeenCalledWith('/api/agent/reports?from=2026-01-01&contractId=contract+1')
  })
})

describe('workspace profile and search use cases', () => {
  it('passes validated matching criteria to the repository', async () => {
    const api = workspaceApi(() => [])
    const criteria = {
      city: 'Maputo',
      district: 'KaMpfumo',
      skills: ['CLEANING'],
      availability: ['MON'],
    }

    await makeSearchMatching(api)(criteria)

    expect(api.findMatches).toHaveBeenCalledWith(criteria)
  })

  describe('workspace action use cases', () => {
    it('submits a hire request with the cancellation signal and responds to invitations', async () => {
      const api = workspaceApi((path) => path === '/api/requests' ? { id: 'request-1' } : {})
      const actions = makeWorkspaceActions(api)
      const signal = new AbortController().signal
      const request = {
        housekeeperId: 'worker-1',
        requiredSkills: ['CLEANING'],
        taskIds: ['task-1'],
        requiredDays: ['MON'],
        city: 'Maputo',
        district: 'KaMpfumo',
        neighborhood: '',
        startTime: '08:00',
        endTime: '16:00',
        startDate: '2026-11-20',
        taskScope: 'House cleaning and organization',
        monthlySalary: 7000,
        durationMonths: 12,
        hoursPerDay: 8,
        notes: '',
      }

      await actions.submitHireRequest(request, signal)
      await actions.respondToHireRequest('request-1', true)

      expect(api.request).toHaveBeenNthCalledWith(1, '/api/requests', {
        method: 'POST',
        body: JSON.stringify(request),
        signal,
      })
      expect(api.request).toHaveBeenNthCalledWith(2, '/api/requests/request-1/worker-decision?accepted=true', { method: 'PATCH' })
    })

    it('creates an incident and then attaches supporting evidence as a message', async () => {
      const api = workspaceApi((path) => path === '/api/incidents' ? { id: 'incident-1' } : {})
      const actions = makeWorkspaceActions(api)
      const evidence = new File(['evidence'], 'evidence.pdf', { type: 'application/pdf' })

      await actions.reportIncident({ contractId: 'contract-1', description: 'Issue', type: 'OTHER', evidence })

      expect(api.request).toHaveBeenNthCalledWith(1, '/api/incidents', {
        method: 'POST',
        body: JSON.stringify({ contractId: 'contract-1', description: 'Issue', type: 'OTHER' }),
      })
      const message = vi.mocked(api.request).mock.calls[1][1]
      expect(vi.mocked(api.request).mock.calls[1][0]).toBe('/api/incidents/incident-1/messages')
      expect(message?.method).toBe('POST')
      expect(message?.body).toBeInstanceOf(FormData)
    })

    it('converts typed money fields before creating an additional-work request', async () => {
      const api = workspaceApi(() => ({}))
      const actions = makeWorkspaceActions(api)

      await actions.submitAdditionalWork({
        contractId: 'contract-1',
        description: 'Extra cleaning',
        date: '2026-11-19',
        quantity: '2.5',
        unitPrice: '350',
        workType: 'OVERTIME',
      })

      expect(api.request).toHaveBeenCalledWith('/api/additional-work', {
        method: 'POST',
        body: JSON.stringify({
          contractId: 'contract-1',
          description: 'Extra cleaning',
          date: '2026-11-19',
          quantity: 2.5,
          unitPrice: 350,
          workType: 'OVERTIME',
        }),
      })
    })

    it('loads and downloads finance statements using the selected period', async () => {
      const api = workspaceApi(() => ({ total: 500 }))
      const actions = makeWorkspaceActions(api)

      await actions.loadStatement('contract-1', '2026-10')
      await actions.downloadStatement('contract-1', '2026-10')

      expect(api.request).toHaveBeenCalledWith('/api/contracts/contract-1/statement?period=2026-10')
      expect(api.download).toHaveBeenCalledWith('/api/contracts/contract-1/statement.pdf?period=2026-10', 'demonstrativo-2026-10.pdf')
    })
  })

  it('normalizes numeric worker profile fields before saving', async () => {
    const api = workspaceApi(() => [])
    const profile = {
      birthDate: '1990-01-02',
      phone: '841234567',
      city: 'Maputo',
      district: 'KaMpfumo',
      neighborhood: 'Polana',
      skills: ['CLEANING'],
      availability: ['MON'],
      expectedSalary: '7500',
      yearsOfExperience: '4',
    }

    await makeSaveWorkerProfile(api)({ profile, existing: true })

    expect(api.saveWorkerProfile).toHaveBeenCalledWith({
      profile: { ...profile, expectedSalary: 7500, yearsOfExperience: 4 },
      existing: true,
    })
  })

  it('saves client contact details as provided', async () => {
    const api = workspaceApi(() => [])
    const profile = { phone: '841234567', address: 'Rua 1, Maputo' }

    await makeSaveClientProfile(api)(profile)

    expect(api.saveClientProfile).toHaveBeenCalledWith(profile)
  })
})
