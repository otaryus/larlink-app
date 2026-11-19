export interface WorkspaceWorker {
  id: string
  birthDate?: string
  accountId?: string
  account?: { id: string }
  name: string
  phone?: string
  city: string
  district?: string
  neighborhood: string
  skills: string[]
  availability: string[]
  expectedSalary: number
  yearsOfExperience: number
  status: string
  rejectionReason?: string
  matchReason?: string
  completedContracts?: number
  agencyRecommendation?: string
  score?: number
  distanceKm?: number
  proximityScore?: number
  maximumDistanceKm?: number
  canRequest?: boolean
  missingSkills?: string[]
  missingAvailability?: string[]
}

export interface WorkspaceClientProfile {
  phone: string
  address: string
}

export interface WorkspaceRequest {
  id: string
  status: string
  requiredSkills: string[]
  requiredDays: string[]
  startDate: string
  startTime?: string
  endTime?: string
  district?: string
  neighborhood?: string
  notes: string
  taskScope: string
  monthlySalary: number
  durationMonths: number
  hoursPerDay: number
  rejectionReason?: string
  housekeeper: WorkspaceWorker
  client: { id: string; name: string }
}

export interface WorkspaceProposal {
  id: string
  authorId: string
  authorName: string
  monthlySalary: number
  status: string
  message?: string
  createdAt: string
}

export interface WorkspaceContract {
  id: string
  contractText: string
  aiGenerated: boolean
  status: string
  clientSigned: boolean
  workerSigned: boolean
  clientSignatureName?: string
  workerSignatureName?: string
  agencyReviewed: boolean
  agencyReviewState?: string
  agencyReviewNote?: string
  clientConfirmedStart: boolean
  workerConfirmedStart: boolean
  workStarted: boolean
  hireRequest: WorkspaceRequest
}

export interface WorkspaceIncident {
  id: string
  type: string
  description: string
  status: string
  createdAt: string
  reporter: { name: string }
  contract: WorkspaceContract
  agencyDecision?: string
}

export interface WorkspacePartyIncident {
  id: string
  contractId: string
  type: string
  description: string
  status: string
  reporter: string
  decision: string
  createdAt: string
}

export interface WorkspaceIncidentMessage {
  id: string
  author: string
  message: string
  hasAttachment: boolean
  createdAt: string
}

export interface WorkspaceTask {
  id: string
  name: string
  description: string
  skillCode: string
}

export interface WorkspaceDashboard {
  totalCandidates: number
  pendingProfiles: number
  approvedProfiles: number
  pendingRequests: number
  totalClients: number
  totalContracts: number
  openIncidents: number
}

export interface WorkspaceNegotiation {
  request: WorkspaceRequest
  proposals: WorkspaceProposal[]
}

export type WorkspaceRow = Record<string, unknown>

export interface OperationsReportFilters {
  from: string
  to: string
  contractId: string
  clientId: string
  workerId: string
}
