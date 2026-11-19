import type {
  OperationsReportFilters,
  WorkspaceClientProfile,
  WorkspaceContract,
  WorkspaceDashboard,
  WorkspaceIncident,
  WorkspaceIncidentMessage,
  WorkspaceNegotiation,
  WorkspacePartyIncident,
  WorkspaceProposal,
  WorkspaceRequest,
  WorkspaceRow,
  WorkspaceTask,
  WorkspaceWorker,
} from '../domain/Workspace'
import type { MatchingCriteria, WorkerWorkspaceProfile, WorkspaceApi } from '../ports/WorkspaceApi'

export interface RoleHomeSnapshot {
  tasks?: WorkspaceTask[]
  client?: WorkspaceClientProfile | null
  worker?: WorkspaceWorker | null
  workers?: WorkspaceWorker[]
  requests?: WorkspaceRequest[]
  workerRequests?: WorkspaceRequest[]
  workerProposalRows?: WorkspaceNegotiation[]
  contractsList?: WorkspaceContract[]
  incidents?: WorkspaceIncident[]
  partyIncidents?: WorkspacePartyIncident[]
  incidentMessages?: Record<string, WorkspaceIncidentMessage[]>
  dashboard?: WorkspaceDashboard
}

export interface RoleHomeQuery {
  role: string
  pathname: string
}

async function loadMessages(
  api: WorkspaceApi,
  incidents: WorkspacePartyIncident[] | WorkspaceIncident[],
  endpoint: (incident: WorkspacePartyIncident | WorkspaceIncident) => string,
): Promise<Record<string, WorkspaceIncidentMessage[]>> {
  const entries = await Promise.all(incidents.map(async (incident) => [
    incident.id,
    await api.request<WorkspaceIncidentMessage[]>(endpoint(incident)),
  ] as const))
  return Object.fromEntries(entries)
}

async function profileOrNone<T>(request: () => Promise<T>): Promise<T | null> {
  try {
    return await request()
  } catch (error) {
    if ((error as Error).message.includes('(404)')) return null
    throw error
  }
}

export function makeLoadRoleHome(api: WorkspaceApi) {
  return async function loadRoleHome(query: RoleHomeQuery): Promise<RoleHomeSnapshot> {
    const { pathname } = query
    const snapshot: RoleHomeSnapshot = {}
    const clientRole = query.role === 'CLIENT'
    const workerRole = query.role === 'HOUSEKEEPER' || query.role === 'CANDIDATE'
    const agencyRole = query.role === 'AGENCY'
    const secretaryRole = query.role === 'SECRETARY'

    if (clientRole) {
      snapshot.tasks = await api.request('/api/tasks')
      snapshot.client = await profileOrNone(() => api.request('/api/clients/me'))
      snapshot.requests = await api.request('/api/requests')
      if (pathname.includes('contratos') || pathname.includes('ocorrencias'))
        snapshot.contractsList = await api.request('/api/contracts')
      if (pathname.includes('ocorrencias')) {
        const incidents = await api.request<WorkspacePartyIncident[]>('/api/incidents')
        snapshot.partyIncidents = incidents
        snapshot.incidentMessages = await loadMessages(
          api,
          incidents,
          (incident) => `/api/incidents/${incident.id}/messages`,
        )
      }

    } else if (workerRole) {
      snapshot.worker = await profileOrNone(() => api.request('/api/housekeepers/me'))
      const [inbox, contracts] = await Promise.all([
        api.request<WorkspaceRequest[]>('/api/requests/inbox'),
        api.request<WorkspaceContract[]>('/api/contracts'),
      ])
      snapshot.workerRequests = inbox
      snapshot.contractsList = contracts
      if (pathname === '/perfil') {
        snapshot.workerProposalRows = await Promise.all(inbox.map(async (request) => ({
          request,
          proposals: await api.request<WorkspaceProposal[]>(`/api/requests/${request.id}/proposals`),
        })))
      }
      if (pathname.includes('ocorrencias')) {
        const incidents = await api.request<WorkspacePartyIncident[]>('/api/incidents')
        snapshot.partyIncidents = incidents
        snapshot.incidentMessages = await loadMessages(
          api,
          incidents,
          (incident) => `/api/incidents/${incident.id}/messages`,
        )
      }
    } else if (agencyRole || secretaryRole) {
      const [workers, requests] = await Promise.all([
        api.request<WorkspaceWorker[]>('/api/housekeepers'),
        api.request<WorkspaceRequest[]>('/api/requests'),
      ])
      snapshot.workers = workers
      snapshot.requests = requests
      if (agencyRole) snapshot.dashboard = await api.request('/api/agent/dashboard')
      if (agencyRole && pathname.includes('contratos'))
        snapshot.contractsList = await api.request('/api/contracts')
      if (agencyRole && pathname.includes('ocorrencias')) {
        const incidents = await api.request<WorkspaceIncident[]>('/api/agent/incidents')
        snapshot.incidents = incidents
        snapshot.incidentMessages = await loadMessages(
          api,
          incidents,
          (incident) => `/api/incident-messages/${incident.id}`,
        )
      }
    }

    return snapshot
  }
}

export function makeSearchMatching(api: WorkspaceApi) {
  return function searchMatching(criteria: MatchingCriteria) {
    return api.findMatches(criteria)
  }
}

export function makeSaveClientProfile(api: WorkspaceApi) {
  return function saveClientProfile(profile: WorkspaceClientProfile) {
    return api.saveClientProfile(profile)
  }
}

export function makeSaveWorkerProfile(api: WorkspaceApi) {
  return function saveWorkerProfile(input: { profile: WorkerWorkspaceProfile; existing: boolean }) {
    return api.saveWorkerProfile({
      ...input,
      profile: {
        ...input.profile,
        expectedSalary: Number(input.profile.expectedSalary),
        yearsOfExperience: Number(input.profile.yearsOfExperience),
      },
    })
  }
}

export function makeSaveWorkerPhoto(api: WorkspaceApi) {
  return function saveWorkerPhoto(form: FormData) {
    return api.saveWorkerPhoto(form)
  }
}

function jsonBody(value: unknown): Pick<RequestInit, 'body'> {
  return { body: JSON.stringify(value) }
}

export interface HireRequestCommand {
  housekeeperId: string
  requiredSkills: string[]
  taskIds: string[]
  requiredDays: string[]
  city: string
  district: string
  neighborhood: string
  startTime: string
  endTime: string
  startDate: string
  taskScope: string
  monthlySalary: number
  durationMonths: number
  hoursPerDay: number
  notes: string
}

export interface AdditionalWorkCommand {
  contractId: string
  description: string
  date: string
  quantity: number | string
  unitPrice: number | string
  workType: string
}

export interface FinanceSettings {
  monthlyDivisor: number | string
  overtimeHourlyRate: number | string
  additionalServiceUnitRate: number | string
  paymentDueDay: number | string
  requestValidityDays: number | string
  agencyFeePercent: number | string
}

export function makeWorkspaceActions(api: WorkspaceApi) {
  return {
    submitHireRequest(command: HireRequestCommand, signal: AbortSignal) {
      return api.request<WorkspaceRequest>('/api/requests', {
        method: 'POST',
        ...jsonBody(command),
        signal,
      })
    },
    respondToHireRequest(id: string, accepted: boolean) {
      return api.request<{ contract?: WorkspaceContract }>(
        `/api/requests/${id}/worker-decision?accepted=${accepted}`,
        { method: 'PATCH' },
      )
    },
    submitSalaryProposal(requestId: string, command: { monthlySalary: number; message: string }) {
      return api.request(`/api/requests/${requestId}/proposals`, {
        method: 'POST',
        ...jsonBody(command),
      })
    },
    decideSalaryProposal(requestId: string, proposalId: string, decision: 'ACCEPTED' | 'REJECTED') {
      return api.request(`/api/requests/${requestId}/proposals/${proposalId}`, {
        method: 'PATCH',
        ...jsonBody({ decision }),
      })
    },
    signContract(id: string, command: { fullName: string; contractRead: boolean }) {
      return api.request<WorkspaceContract>(`/api/contracts/${id}/sign`, {
        method: 'PATCH',
        ...jsonBody(command),
      })
    },
    confirmWorkStarted(id: string) {
      return api.request<WorkspaceContract>(`/api/contracts/${id}/started`, { method: 'PATCH' })
    },
    reviewContract(id: string, approved: boolean, note?: string) {
      return api.request(`/api/agent/contracts/${id}/review`, {
        method: 'PATCH',
        ...jsonBody(note === undefined ? { approved } : { approved, note }),
      })
    },
    terminateContract(id: string, reason: string) {
      return api.request(`/api/agent/contracts/${id}/terminate?reason=${encodeURIComponent(reason)}`, { method: 'PATCH' })
    },
    downloadContract(id: string) {
      return api.download(`/api/contracts/${id}/pdf`, `contrato-${id}.pdf`)
    },
    createAgent(form: FormData) {
      return api.request<{ name: string; email: string; role: string; temporaryPassword: string }>('/api/agent/users', {
        method: 'POST',
        body: form,
      })
    },
    updateIncidentStatus(id: string, status: string, decision: string) {
      return api.request(`/api/agent/incidents/${id}/status`, {
        method: 'PATCH',
        ...jsonBody({ status, decision }),
      })
    },
    async reportIncident(command: { contractId: string; description: string; type: string; evidence?: File | null }) {
      const { evidence, ...incident } = command
      const created = await api.request<{ id: string }>('/api/incidents', {
        method: 'POST',
        ...jsonBody(incident),
      })
      if (evidence) {
        const body = new FormData()
        body.append('message', 'Comprovativo anexado ao reporte.')
        body.append('file', evidence)
        await api.request(`/api/incidents/${created.id}/messages`, { method: 'POST', body })
      }
      return created
    },
    replyToIncident(id: string, message: string, file?: File | null) {
      const body = new FormData()
      if (message.trim()) body.append('message', message.trim())
      if (file) body.append('file', file)
      return api.request(`/api/incidents/${id}/messages`, { method: 'POST', body })
    },
    decideHousekeeper(id: string, status: string, reason?: string) {
      return api.request(`/api/housekeepers/${id}/decision?status=${status}${reason ? `&reason=${encodeURIComponent(reason)}` : ''}`, { method: 'PATCH' })
    },
    decideHireRequest(id: string, status: string, reason?: string) {
      return api.request(`/api/requests/${id}/decision?status=${status}${reason ? `&reason=${encodeURIComponent(reason)}` : ''}`, { method: 'PATCH' })
    },
    downloadIncidentAttachment(id: string) {
      return api.download(`/api/incident-messages/${id}/attachment`, `anexo-ocorrencia-${id}`)
    },
    decideAbsence(id: string, decision: 'JUSTIFICADA' | 'NAO_JUSTIFICADA', note: string) {
      return api.request(`/api/agent/absences/${id}/decision?decision=${decision}&note=${encodeURIComponent(note)}`, { method: 'PATCH' })
    },
    submitAbsenceJustification(id: string, text: string, evidence?: File | null) {
      const body = new FormData()
      if (text.trim()) body.append('text', text.trim())
      if (evidence) body.append('file', evidence)
      return api.request(`/api/absences/${id}/justification`, { method: 'POST', body })
    },
    declareAbsenceHasNoJustification(id: string) {
      return api.request(`/api/absences/${id}/no-justification`, { method: 'PATCH' })
    },
    saveTestDate(date: string) {
      return api.request<{ serverDate: string; testDateOverride: string }>('/api/agent/settings/test-date', {
        method: 'PUT',
        ...jsonBody({ date: date || null }),
      })
    },
    createTask(command: { name: string; description: string; skillCode: string }) {
      return api.request('/api/agent/tasks', { method: 'POST', ...jsonBody(command) })
    },
    saveFinanceSettings(settings: FinanceSettings) {
      return api.request<WorkspaceRow>('/api/agent/settings/finance', {
        method: 'PUT',
        ...jsonBody({
          monthlyDivisor: Number(settings.monthlyDivisor),
          overtimeHourlyRate: Number(settings.overtimeHourlyRate),
          additionalServiceUnitRate: Number(settings.additionalServiceUnitRate),
          paymentDueDay: Number(settings.paymentDueDay),
          requestValidityDays: Number(settings.requestValidityDays),
          agencyFeePercent: Number(settings.agencyFeePercent),
        }),
      })
    },
    registerAbsence(command: { contractId: string; date: string; days: number | string; notes: string }) {
      return api.request('/api/absences', {
        method: 'POST',
        ...jsonBody({ ...command, days: Number(command.days) }),
      })
    },
    downloadAbsenceEvidence(id: string) {
      return api.download(`/api/absences/${id}/evidence`, `comprovativo-${id}`)
    },
    submitAdditionalWork(command: AdditionalWorkCommand) {
      return api.request('/api/additional-work', {
        method: 'POST',
        ...jsonBody({
          ...command,
          quantity: Number(command.quantity),
          unitPrice: Number(command.unitPrice),
        }),
      })
    },
    decideAdditionalWork(id: string, decision: 'APPROVED' | 'REJECTED') {
      return api.request(`/api/agent/additional-work/${id}?decision=${decision}`, { method: 'PATCH' })
    },
    createPaymentObligation(contractId: string, period: string) {
      return api.request(`/api/contracts/${contractId}/payment-obligations?period=${period}`, { method: 'POST' })
    },
    simulatePayment(id: string) {
      return api.request(`/api/agent/payment-obligations/${id}/simulate-payment`, { method: 'POST' })
    },
    issuePaymentReference(id: string) {
      return api.request(`/api/agent/payment-obligations/${id}/issue-reference`, { method: 'POST' })
    },
    markNotificationRead(id: string) {
      return api.request(`/api/notifications/${id}/read`, { method: 'PATCH' })
    },
    loadStatement(contractId: string, period: string) {
      return api.request<WorkspaceRow>(`/api/contracts/${contractId}/statement?period=${period}`)
    },
    downloadStatement(contractId: string, period: string) {
      return api.download(`/api/contracts/${contractId}/statement.pdf?period=${period}`, `demonstrativo-${period}.pdf`)
    },
    closeFinancePeriod(contractId: string, period: string) {
      return api.request(`/api/agent/finance/${contractId}/${period}/close`, { method: 'POST' })
    },
    addFinanceAdjustment(contractId: string, period: string, amount: number | string, reason: string) {
      return api.request(`/api/agent/finance/${contractId}/${period}/adjustments`, {
        method: 'POST',
        ...jsonBody({ amount: Number(amount), reason }),
      })
    },
  }
}

export interface ContractTimeline {
  contracts: WorkspaceContract[]
  serverDate: string
}

export function makeLoadContractTimeline(api: WorkspaceApi) {
  return async function loadContractTimeline(): Promise<ContractTimeline> {
    const [contracts, time] = await Promise.all([
      api.request<WorkspaceContract[]>('/api/contracts'),
      api.request<{ serverDate: string }>('/api/time'),
    ])
    return { contracts, serverDate: time.serverDate }
  }
}

export interface OperationsQuery {
  pathname: string
  role: string
  reportFilters: OperationsReportFilters
}

export interface OperationsSnapshot {
  rows?: WorkspaceRow[]
  contracts?: WorkspaceContract[]
  testPaymentsEnabled?: boolean
  policy?: WorkspaceRow
  testDate?: { serverDate: string; testDateOverride: string } | null
}

export function makeLoadOperations(api: WorkspaceApi) {
  return async function loadOperations(query: OperationsQuery): Promise<OperationsSnapshot> {
    const { pathname, role, reportFilters } = query
    const agent = role === 'AGENCY'
    const client = role === 'CLIENT'
    const worker = role === 'HOUSEKEEPER' || role === 'CANDIDATE'

    if (pathname === '/tarefas') return { rows: await api.request('/api/tasks') }
    if (pathname === '/configuracoes-financeiras' || pathname === '/data-hora') {
      const snapshot: OperationsSnapshot = {}
      if (pathname === '/configuracoes-financeiras')
        snapshot.policy = await api.request('/api/agent/settings/finance')
      try {
        snapshot.testDate = await api.request('/api/agent/settings/test-date')
      } catch (error) {
        if (!(error as Error).message.includes('(404)')) throw error
        snapshot.testDate = null
      }
      return snapshot
    }
    if (pathname === '/notificacoes') return { rows: await api.request('/api/notifications') }
    if (pathname === '/auditoria') return { rows: await api.request('/api/agent/audit') }
    if (pathname === '/relatorios') {
      const filters = new URLSearchParams(Object.entries(reportFilters).filter(([, value]) => value))
      const [report, contracts] = await Promise.all([
        api.request<WorkspaceRow>(`/api/agent/reports?${filters}`),
        api.request<WorkspaceContract[]>('/api/contracts'),
      ])
      return { rows: [report], contracts }
    }
    if (pathname === '/propostas') {
      const [own, inbox, agencyRequests] = await Promise.all([
        client ? api.request<WorkspaceRequest[]>('/api/requests') : Promise.resolve([]),
        worker ? api.request<WorkspaceRequest[]>('/api/requests/inbox') : Promise.resolve([]),
        agent ? api.request<WorkspaceRequest[]>('/api/requests') : Promise.resolve([]),
      ])
      const requests = [...own, ...inbox, ...agencyRequests]
      return {
        rows: await Promise.all(requests.map(async (request) => ({
          request,
          proposals: await api.request<WorkspaceProposal[]>(`/api/requests/${request.id}/proposals`),
        }))),
      }
    }
    if (['/faltas', '/extras', '/pagamentos', '/financeiro'].includes(pathname)) {
      const resource = pathname === '/faltas' ? '/api/absences'
        : pathname === '/extras' ? '/api/additional-work'
          : pathname === '/pagamentos' ? '/api/payment-obligations' : '/api/contracts'
      const testSettings = pathname === '/pagamentos' && agent
        ? api.request<{ enabled: boolean }>('/api/agent/settings/payment-testing')
        : Promise.resolve({ enabled: false })
      const [rows, contracts, testing] = await Promise.all([
        api.request<WorkspaceRow[]>(resource),
        api.request<WorkspaceContract[]>('/api/contracts'),
        testSettings,
      ])
      return { rows, contracts, testPaymentsEnabled: testing.enabled }
    }
    return {}
  }
}
