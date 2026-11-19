import type { Clock } from '../../../shared/ports/services'
import type { ClientRepository } from '../../clients/ports/ClientRepository'
import type { ContractRepository } from '../../contracts/ports/ContractRepository'
import type { HousekeeperRepository } from '../../housekeepers/ports/HousekeeperRepository'
import type { ReviewRepository } from '../../reviews/ports/ReviewRepository'
import { computeStats, type DashboardStats, type Period } from '../domain/Stats'

export interface GetDashboardDeps {
  housekeepers: HousekeeperRepository
  clients: ClientRepository
  contracts: ContractRepository
  reviews: ReviewRepository
  now: Clock
}

export function makeGetDashboard(deps: GetDashboardDeps) {
  return async function getDashboard(period: Period): Promise<DashboardStats> {
    const [housekeepers, clients, contracts, reviews] = await Promise.all([
      deps.housekeepers.findAll(),
      deps.clients.findAll(),
      deps.contracts.findAll(),
      deps.reviews.findAll(),
    ])
    return computeStats({ housekeepers, clients, contracts, reviews }, period, deps.now())
  }
}
