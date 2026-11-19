import type { Container } from '../../../app/container'
import type { Housekeeper } from '../../housekeepers/domain/Housekeeper'
import { averageRating } from '../../reviews/domain/Review'
import { availabilityOf, type Availability } from '../domain/PlacementStatus'

export interface CandidateCardData {
  housekeeper: Housekeeper
  rating: number | null
  reviewCount: number
  availability: Availability
}

export async function toCandidateCards(
  { repositories }: Container,
  housekeepers: Housekeeper[],
): Promise<CandidateCardData[]> {
  const [reviews, requests, contracts] = await Promise.all([
    repositories.reviews.findAll(),
    repositories.hireRequests.findAll(),
    repositories.contracts.findAll(),
  ])
  return housekeepers.map((housekeeper) => {
    const own = reviews.filter((r) => r.housekeeperId === housekeeper.id)
    return {
      housekeeper,
      rating: averageRating(own),
      reviewCount: own.length,
      availability: availabilityOf(housekeeper.id, requests, contracts),
    }
  })
}
