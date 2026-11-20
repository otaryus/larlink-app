import { ageAt, isValidDate } from '../../../shared/domain/dates'
import { throwIfErrors, ValidationError, type FieldErrors } from '../../../shared/domain/errors'
import { MAX_CONTRACT_MONTHS, MINIMUM_WAGE_MZN, MIN_HOUSEKEEPER_AGE, MIN_REASON_LENGTH } from '../../../shared/domain/policies'
import { isIntegerBetween, isValidEmail, isValidFullName, isValidPhone, normalizePhone } from '../../../shared/domain/validators'
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
    const errors: FieldErrors = {}
    if (!criteria.city.trim() || !criteria.district.trim()) errors.district = 'Seleccione uma localização.'
    if (!criteria.skills.length) errors.skills = 'Seleccione pelo menos uma competência.'
    if (!criteria.availability.length) errors.availability = 'Seleccione pelo menos um dia de trabalho.'
    if (criteria.maxSalary !== undefined
      && (!Number.isFinite(criteria.maxSalary) || criteria.maxSalary < MINIMUM_WAGE_MZN))
      errors.maxSalary = `O limite salarial deve ser igual ou superior a ${MINIMUM_WAGE_MZN} MT.`
    throwIfErrors(errors)
    return api.findMatches(criteria)
  }
}

export function makeSaveClientProfile(api: WorkspaceApi) {
  return function saveClientProfile(profile: WorkspaceClientProfile) {
    const errors: FieldErrors = {}
    if (!isValidPhone(profile.phone)) errors.phone = 'Indique um telemóvel moçambicano válido.'
    if (profile.address.trim().length < 5 || profile.address.trim().length > 500)
      errors.address = 'O endereço deve ter entre 5 e 500 caracteres.'
    throwIfErrors(errors)
    return api.saveClientProfile({ ...profile, phone: normalizePhone(profile.phone), address: profile.address.trim() })
  }
}

export function makeSaveWorkerProfile(api: WorkspaceApi) {
  return function saveWorkerProfile(input: { profile: WorkerWorkspaceProfile; existing: boolean }) {
    const { profile } = input
    const errors: FieldErrors = {}
    if (!isValidDate(profile.birthDate) || ageAt(profile.birthDate, new Date()) < MIN_HOUSEKEEPER_AGE)
      errors.birthDate = `A trabalhadora deve ter pelo menos ${MIN_HOUSEKEEPER_AGE} anos.`
    if (!isValidPhone(profile.phone)) errors.phone = 'Indique um telemóvel moçambicano válido.'
    if (!profile.city.trim() || !profile.district.trim()) errors.district = 'Seleccione uma localização.'
    if (profile.neighborhood.trim().length < 3 || profile.neighborhood.trim().length > 100)
      errors.neighborhood = 'O bairro deve ter entre 3 e 100 caracteres.'
    if (!profile.skills.length) errors.skills = 'Seleccione pelo menos uma competência.'
    if (!profile.availability.length) errors.availability = 'Seleccione pelo menos um dia disponível.'
    const expectedSalary = Number(profile.expectedSalary)
    if (!Number.isInteger(expectedSalary) || expectedSalary < MINIMUM_WAGE_MZN || expectedSalary % 50 !== 0)
      errors.expectedSalary = `O salário deve ser igual ou superior a ${MINIMUM_WAGE_MZN} MT e múltiplo de 50.`
    if (!isIntegerBetween(Number(profile.yearsOfExperience), 0, 50))
      errors.yearsOfExperience = 'A experiência deve ser um número inteiro entre 0 e 50.'
    throwIfErrors(errors)
    return api.saveWorkerProfile({
      ...input,
      profile: {
        ...input.profile,
        phone: normalizePhone(profile.phone),
        expectedSalary,
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

function validIncidentFile(file?: File | null): boolean {
  return !file || (file.size <= 5_000_000 && ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type))
}

function validTime(value: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
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
      const errors: FieldErrors = {}
      if (!command.housekeeperId) errors.housekeeperId = 'Seleccione uma trabalhadora.'
      if (command.requiredSkills.length === 0) errors.requiredSkills = 'Seleccione pelo menos uma competência.'
      if (command.taskIds.length === 0) errors.taskIds = 'Seleccione pelo menos uma tarefa.'
      if (command.requiredDays.length === 0) errors.requiredDays = 'Seleccione pelo menos um dia de trabalho.'
      if (!command.city.trim() || !command.district.trim()) errors.district = 'Seleccione uma localização.'
      if (command.neighborhood.trim().length > 100) errors.neighborhood = 'O bairro não pode exceder 100 caracteres.'
      if (!validTime(command.startTime) || !validTime(command.endTime) || command.endTime <= command.startTime)
        errors.startTime = 'Indique horários válidos e uma hora de saída posterior à entrada.'
      if (!isValidDate(command.startDate) || command.startDate <= new Date().toISOString().slice(0, 10))
        errors.startDate = 'A data de início deve ser futura.'
      if (command.taskScope.trim().length < 15 || command.taskScope.trim().length > 2000)
        errors.taskScope = 'Descreva as tarefas com entre 15 e 2.000 caracteres.'
      if (!Number.isInteger(command.monthlySalary) || command.monthlySalary < MINIMUM_WAGE_MZN || command.monthlySalary % 50 !== 0)
        errors.monthlySalary = `O salário deve ser igual ou superior a ${MINIMUM_WAGE_MZN} MT e múltiplo de 50.`
      if (!isIntegerBetween(command.durationMonths, 1, MAX_CONTRACT_MONTHS))
        errors.durationMonths = `A duração deve ser entre 1 e ${MAX_CONTRACT_MONTHS} meses.`
      if (!Number.isFinite(command.hoursPerDay) || command.hoursPerDay <= 0 || command.hoursPerDay > 24)
        errors.hoursPerDay = 'Indique uma duração diária válida.'
      if (command.notes.length > 2000) errors.notes = 'As observações não podem exceder 2.000 caracteres.'
      throwIfErrors(errors)
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
      const errors: FieldErrors = {}
      if (!requestId) errors.requestId = 'O pedido é obrigatório.'
      if (!Number.isInteger(command.monthlySalary) || command.monthlySalary < MINIMUM_WAGE_MZN || command.monthlySalary % 50 !== 0)
        errors.monthlySalary = `A proposta deve ser igual ou superior a ${MINIMUM_WAGE_MZN} MT e múltiplo de 50.`
      if (command.message.trim().length > 500) errors.message = 'A mensagem não pode exceder 500 caracteres.'
      throwIfErrors(errors)
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
      const errors: FieldErrors = {}
      if (!id) errors.contractId = 'O contrato é obrigatório.'
      if (!command.contractRead) errors.contractRead = 'Confirme que leu o contrato.'
      if (!isValidFullName(command.fullName)) errors.fullName = 'Indique o nome e apelido registados.'
      throwIfErrors(errors)
      return api.request<WorkspaceContract>(`/api/contracts/${id}/sign`, {
        method: 'PATCH',
        ...jsonBody(command),
      })
    },
    confirmWorkStarted(id: string) {
      return api.request<WorkspaceContract>(`/api/contracts/${id}/started`, { method: 'PATCH' })
    },
    reviewContract(id: string, approved: boolean, note?: string) {
      if (!id) throw new ValidationError({ contractId: 'O contrato é obrigatório.' })
      if (!approved && (note?.trim().length ?? 0) < MIN_REASON_LENGTH)
        throw new ValidationError({ note: `Explique as alterações necessárias com pelo menos ${MIN_REASON_LENGTH} caracteres.` })
      return api.request(`/api/agent/contracts/${id}/review`, {
        method: 'PATCH',
        ...jsonBody(note === undefined ? { approved } : { approved, note }),
      })
    },
    terminateContract(id: string, reason: string) {
      if (!id) throw new ValidationError({ contractId: 'O contrato é obrigatório.' })
      if (reason.trim().length < MIN_REASON_LENGTH || reason.trim().length > 1000)
        throw new ValidationError({ reason: `O motivo deve ter entre ${MIN_REASON_LENGTH} e 1.000 caracteres.` })
      return api.request(`/api/agent/contracts/${id}/terminate?reason=${encodeURIComponent(reason)}`, { method: 'PATCH' })
    },
    downloadContract(id: string) {
      return api.download(`/api/contracts/${id}/pdf`, `contrato-${id}.pdf`)
    },
    async createAgent(form: FormData) {
      const accountPart = form.get('account')
      if (!(accountPart instanceof Blob)) throw new ValidationError({ account: 'Os dados da conta são obrigatórios.' })
      let account: { name?: unknown; email?: unknown; role?: unknown; phone?: unknown; address?: unknown }
      try {
        const parsed: unknown = JSON.parse(await accountPart.text())
        if (!parsed || typeof parsed !== 'object') throw new SyntaxError('Expected an account object.')
        account = parsed as typeof account
      } catch {
        throw new ValidationError({ account: 'Os dados da conta são inválidos.' })
      }
      const errors: FieldErrors = {}
      if (typeof account.name !== 'string' || !isValidFullName(account.name)) errors.name = 'Indique o nome e apelido.'
      if (typeof account.email !== 'string' || !isValidEmail(account.email)) errors.email = 'Indique um email válido.'
      if (!['SECRETARY', 'CLIENT', 'AGENT'].includes(String(account.role))) errors.role = 'Seleccione um tipo de conta válido.'
      if (account.role === 'CLIENT') {
        if (typeof account.phone !== 'string' || !isValidPhone(account.phone)) errors.phone = 'Indique um telemóvel moçambicano válido.'
        if (typeof account.address !== 'string' || account.address.trim().length < 5 || account.address.trim().length > 500)
          errors.address = 'Indique um endereço entre 5 e 500 caracteres.'
        const photo = form.get('photo')
        if (!(photo instanceof File) || !['image/jpeg', 'image/png', 'image/webp'].includes(photo.type) || photo.size > 3_000_000)
          errors.photo = 'A fotografia deve ser JPG, PNG ou WEBP e ter no máximo 3 MB.'
      }
      throwIfErrors(errors)
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
      const errors: FieldErrors = {}
      if (!command.contractId) errors.contractId = 'Seleccione um contrato.'
      if (command.description.trim().length < MIN_REASON_LENGTH || command.description.trim().length > 2000)
        errors.description = `A descrição deve ter entre ${MIN_REASON_LENGTH} e 2.000 caracteres.`
      if (!command.type.trim()) errors.type = 'Seleccione o tipo de ocorrência.'
      if (!validIncidentFile(command.evidence)) errors.evidence = 'Anexe um PDF, JPEG ou PNG até 5 MB.'
      throwIfErrors(errors)
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
      const errors: FieldErrors = {}
      if (!id) errors.incidentId = 'A ocorrência é obrigatória.'
      if (message.trim().length > 2000) errors.message = 'A resposta não pode exceder 2.000 caracteres.'
      if (message.trim().length < 2 && !file) errors.message = 'Escreva uma resposta ou anexe um comprovativo.'
      if (!validIncidentFile(file)) errors.file = 'Anexe um PDF, JPEG ou PNG até 5 MB.'
      throwIfErrors(errors)
      const body = new FormData()
      if (message.trim()) body.append('message', message.trim())
      if (file) body.append('file', file)
      return api.request(`/api/incidents/${id}/messages`, { method: 'POST', body })
    },
    decideHousekeeper(id: string, status: string, reason?: string) {
      if (!id) throw new ValidationError({ id: 'O perfil é obrigatório.' })
      if (!['APPROVED', 'REJECTED'].includes(status)) throw new ValidationError({ status: 'Seleccione uma decisão válida.' })
      if (status === 'REJECTED' && (reason?.trim().length ?? 0) < MIN_REASON_LENGTH)
        throw new ValidationError({ reason: `O motivo deve ter pelo menos ${MIN_REASON_LENGTH} caracteres.` })
      return api.request(`/api/housekeepers/${id}/decision?status=${status}${reason ? `&reason=${encodeURIComponent(reason)}` : ''}`, { method: 'PATCH' })
    },
    decideHireRequest(id: string, status: string, reason?: string) {
      if (!id) throw new ValidationError({ id: 'O pedido é obrigatório.' })
      if (!['APPROVED', 'REJECTED'].includes(status)) throw new ValidationError({ status: 'Seleccione uma decisão válida.' })
      if (status === 'REJECTED' && (reason?.trim().length ?? 0) < MIN_REASON_LENGTH)
        throw new ValidationError({ reason: `O motivo deve ter pelo menos ${MIN_REASON_LENGTH} caracteres.` })
      return api.request(`/api/requests/${id}/decision?status=${status}${reason ? `&reason=${encodeURIComponent(reason)}` : ''}`, { method: 'PATCH' })
    },
    downloadIncidentAttachment(id: string) {
      return api.download(`/api/incident-messages/${id}/attachment`, `anexo-ocorrencia-${id}`)
    },
    decideAbsence(id: string, decision: 'JUSTIFICADA' | 'NAO_JUSTIFICADA', note: string) {
      return api.request(`/api/agent/absences/${id}/decision?decision=${decision}&note=${encodeURIComponent(note)}`, { method: 'PATCH' })
    },
    submitAbsenceJustification(id: string, text: string, evidence?: File | null) {
      const errors: FieldErrors = {}
      if (!id) errors.absenceId = 'A falta é obrigatória.'
      if (!text.trim() && !evidence) errors.justification = 'Escreva uma justificação ou anexe um comprovativo.'
      if (text.trim().length > 2000) errors.justification = 'A justificação não pode exceder 2.000 caracteres.'
      if (!validIncidentFile(evidence)) errors.evidence = 'Anexe um PDF, JPEG ou PNG até 5 MB.'
      throwIfErrors(errors)
      const body = new FormData()
      if (text.trim()) body.append('text', text.trim())
      if (evidence) body.append('file', evidence)
      return api.request(`/api/absences/${id}/justification`, { method: 'POST', body })
    },
    declareAbsenceHasNoJustification(id: string) {
      return api.request(`/api/absences/${id}/no-justification`, { method: 'PATCH' })
    },
    saveTestDate(date: string) {
      if (date && !isValidDate(date)) throw new ValidationError({ date: 'Indique uma data válida.' })
      return api.request<{ serverDate: string; testDateOverride: string }>('/api/agent/settings/test-date', {
        method: 'PUT',
        ...jsonBody({ date: date || null }),
      })
    },
    createTask(command: { name: string; description: string; skillCode: string }) {
      const errors: FieldErrors = {}
      if (!command.name.trim() || command.name.trim().length > 100) errors.name = 'O nome da tarefa é obrigatório e pode ter até 100 caracteres.'
      if (command.description.length > 500) errors.description = 'A descrição não pode exceder 500 caracteres.'
      if (!command.skillCode.trim()) errors.skillCode = 'Seleccione uma competência.'
      throwIfErrors(errors)
      return api.request('/api/agent/tasks', { method: 'POST', ...jsonBody(command) })
    },
    saveFinanceSettings(settings: FinanceSettings) {
      const values = {
        monthlyDivisor: Number(settings.monthlyDivisor),
        overtimeHourlyRate: Number(settings.overtimeHourlyRate),
        additionalServiceUnitRate: Number(settings.additionalServiceUnitRate),
        paymentDueDay: Number(settings.paymentDueDay),
        requestValidityDays: Number(settings.requestValidityDays),
        agencyFeePercent: Number(settings.agencyFeePercent),
      }
      const errors: FieldErrors = {}
      if (Object.values(settings).some((value) => String(value).trim() === ''))
        errors.settings = 'Preencha todos os parâmetros financeiros.'
      if (!isIntegerBetween(values.monthlyDivisor, 1, 31)) errors.monthlyDivisor = 'O divisor mensal deve ser entre 1 e 31.'
      if (!Number.isFinite(values.overtimeHourlyRate) || values.overtimeHourlyRate < 0) errors.overtimeHourlyRate = 'A tarifa extraordinária deve ser zero ou superior.'
      if (!Number.isFinite(values.additionalServiceUnitRate) || values.additionalServiceUnitRate < 0) errors.additionalServiceUnitRate = 'A tarifa adicional deve ser zero ou superior.'
      if (!isIntegerBetween(values.paymentDueDay, 1, 28)) errors.paymentDueDay = 'O dia de vencimento deve ser entre 1 e 28.'
      if (!isIntegerBetween(values.requestValidityDays, 1, 90)) errors.requestValidityDays = 'A validade deve ser entre 1 e 90 dias.'
      if (!Number.isFinite(values.agencyFeePercent) || values.agencyFeePercent < 0 || values.agencyFeePercent > 100)
        errors.agencyFeePercent = 'A taxa deve ser entre 0 e 100%.'
      throwIfErrors(errors)
      return api.request<WorkspaceRow>('/api/agent/settings/finance', {
        method: 'PUT',
        ...jsonBody(values),
      })
    },
    registerAbsence(command: { contractId: string; date: string; days: number | string; notes: string }) {
      const absenceDays = Number(command.days)
      const errors: FieldErrors = {}
      if (!command.contractId) errors.contractId = 'Seleccione um contrato.'
      if (!isValidDate(command.date)) errors.date = 'Indique uma data válida.'
      if (!Number.isFinite(absenceDays) || absenceDays <= 0 || absenceDays > 31) errors.days = 'Os dias de ausência devem ser maiores que zero e não exceder 31.'
      if (command.notes.length > 1000) errors.notes = 'As observações não podem exceder 1.000 caracteres.'
      throwIfErrors(errors)
      return api.request('/api/absences', {
        method: 'POST',
        ...jsonBody({ ...command, days: absenceDays }),
      })
    },
    downloadAbsenceEvidence(id: string) {
      return api.download(`/api/absences/${id}/evidence`, `comprovativo-${id}`)
    },
    submitAdditionalWork(command: AdditionalWorkCommand) {
      const quantity = Number(command.quantity)
      const unitPrice = Number(command.unitPrice)
      const errors: FieldErrors = {}
      if (!command.contractId) errors.contractId = 'Seleccione um contrato.'
      if (command.description.trim().length < 2 || command.description.trim().length > 500)
        errors.description = 'A descrição deve ter entre 2 e 500 caracteres.'
      if (!isValidDate(command.date)) errors.date = 'Indique uma data válida.'
      if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1000) errors.quantity = 'A quantidade deve ser maior que zero e não exceder 1.000.'
      if (!Number.isFinite(unitPrice) || unitPrice < 0) errors.unitPrice = 'O valor unitário deve ser igual ou superior a zero.'
      if (typeof command.unitPrice === 'string' && !command.unitPrice.trim())
        errors.unitPrice = 'Indique o valor unitário.'
      if (!['ADDITIONAL_SERVICE', 'OVERTIME'].includes(command.workType)) errors.workType = 'Seleccione um tipo de serviço válido.'
      throwIfErrors(errors)
      return api.request('/api/additional-work', {
        method: 'POST',
        ...jsonBody({
          ...command,
          quantity,
          unitPrice,
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
      const numericAmount = Number(amount)
      const errors: FieldErrors = {}
      if (!contractId) errors.contractId = 'Seleccione um contrato.'
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) errors.period = 'Indique um mês de referência válido.'
      if (!Number.isFinite(numericAmount)) errors.amount = 'Indique um valor numérico válido.'
      if (typeof amount === 'string' && !amount.trim()) errors.amount = 'Indique o valor do ajuste.'
      if (reason.trim().length < MIN_REASON_LENGTH || reason.trim().length > 1000)
        errors.reason = `A justificação deve ter entre ${MIN_REASON_LENGTH} e 1.000 caracteres.`
      throwIfErrors(errors)
      return api.request(`/api/agent/finance/${contractId}/${period}/adjustments`, {
        method: 'POST',
        ...jsonBody({ amount: numericAmount, reason: reason.trim() }),
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
