import { throwIfErrors } from '../../../shared/domain/errors'
import type { Housekeeper } from '../../housekeepers/domain/Housekeeper'
import type { HousekeeperRepository } from '../../housekeepers/ports/HousekeeperRepository'
import type { ReviewRepository } from '../../reviews/ports/ReviewRepository'
import { matchesFilter, rankResults, validateSearchFilter, type SearchFilter } from '../domain/Search'
import type { ContractAvailability } from '../ports/ContractAvailability'

export interface SearchHousekeepersDeps {
  housekeepers: HousekeeperRepository
  reviews: ReviewRepository
  availability: ContractAvailability
}

export function makeSearchHousekeepers({ housekeepers, reviews, availability }: SearchHousekeepersDeps) {
  return async function searchHousekeepers(filter: SearchFilter): Promise<Housekeeper[]> {
    throwIfErrors(validateSearchFilter(filter))
    const candidates = (await housekeepers.findAll()).filter((h) => matchesFilter(h, filter))
    const free: Housekeeper[] = []
    for (const h of candidates) if (!(await availability.hasActiveContract(h.id))) free.push(h)
    const reviewCounts: Record<string, number> = {}
    for (const r of await reviews.findAll()) reviewCounts[r.housekeeperId] = (reviewCounts[r.housekeeperId] ?? 0) + 1
    return rankResults(free, reviewCounts)
  }
}
