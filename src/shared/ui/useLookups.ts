import type { Client } from '../../modules/clients/domain/Client'
import type { Housekeeper } from '../../modules/housekeepers/domain/Housekeeper'
import { useQuery } from './ContainerContext'

export function useLookups() {
  return useQuery(
    async ({ repositories }) => {
      const [clients, housekeepers] = await Promise.all([
        repositories.clients.findAll(),
        repositories.housekeepers.findAll(),
      ])
      return {
        client: new Map<string, Client>(clients.map((c) => [c.id, c])),
        housekeeper: new Map<string, Housekeeper>(housekeepers.map((h) => [h.id, h])),
      }
    },
    { client: new Map<string, Client>(), housekeeper: new Map<string, Housekeeper>() },
  )
}
