import type { HireRequest } from './HireRequest'

export interface ContractSnapshot {
  hireRequestId: string
  housekeeperId: string
  status: 'ACTIVE' | 'TERMINATED'
  createdAt: string
  terminatedAt?: string
}

export type Availability = 'AVAILABLE' | 'IN_PLACEMENT' | 'HIRED'

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  AVAILABLE: 'Disponível',
  IN_PLACEMENT: 'Em agenciamento',
  HIRED: 'Contratada',
}

export function availabilityOf(
  housekeeperId: string,
  requests: HireRequest[],
  contracts: ContractSnapshot[],
): Availability {
  if (contracts.some((c) => c.housekeeperId === housekeeperId && c.status === 'ACTIVE')) return 'HIRED'
  const contracted = new Set(contracts.map((c) => c.hireRequestId))
  const open = requests.some(
    (r) =>
      r.housekeeperId === housekeeperId &&
      (r.status === 'PENDING' || (r.status === 'APPROVED' && !contracted.has(r.id))),
  )
  return open ? 'IN_PLACEMENT' : 'AVAILABLE'
}

export type PlacementStage = 'NEW_REQUEST' | 'IN_PROGRESS' | 'CONTRACT_SIGNED' | 'COMPLETED' | 'CLOSED'

export const STAGE_LABELS: Record<PlacementStage, string> = {
  NEW_REQUEST: 'Novo pedido',
  IN_PROGRESS: 'Em processo',
  CONTRACT_SIGNED: 'Contrato assinado',
  COMPLETED: 'Agenciamento concluído',
  CLOSED: 'Encerrado',
}

export function stageOf(request: HireRequest, contract?: ContractSnapshot): PlacementStage {
  if (contract) return contract.status === 'ACTIVE' ? 'CONTRACT_SIGNED' : 'COMPLETED'
  if (request.status === 'PENDING') return 'NEW_REQUEST'
  if (request.status === 'APPROVED') return 'IN_PROGRESS'
  return 'CLOSED'
}

export interface PlacementSummary {
  request: HireRequest
  stage: PlacementStage
  updatedAt: string
}

export function recentPlacements(requests: HireRequest[], contracts: ContractSnapshot[]): PlacementSummary[] {
  const byRequest = new Map(contracts.map((c) => [c.hireRequestId, c]))
  return requests
    .map((request) => {
      const contract = byRequest.get(request.id)
      return {
        request,
        stage: stageOf(request, contract),
        updatedAt: contract?.terminatedAt ?? contract?.createdAt ?? request.createdAt,
      }
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
