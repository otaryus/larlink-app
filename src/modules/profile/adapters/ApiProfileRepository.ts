import { api, json } from '../../../shared/api/client'
import type { ClientProfile, WorkerProfile } from '../domain/Profile'
import type { ProfileRepository } from '../ports/ProfileRepository'

export class ApiProfileRepository implements ProfileRepository {
  loadWorker(): Promise<WorkerProfile> {
    return api('/api/housekeepers/me')
  }

  loadClient(): Promise<ClientProfile> {
    return api('/api/clients/me')
  }

  async saveWorker(profile: WorkerProfile): Promise<void> {
    await api('/api/housekeepers/me', { ...json(profile), method: 'PUT' })
  }

  async saveClient(profile: ClientProfile): Promise<void> {
    await api('/api/clients/me', { ...json(profile), method: 'PUT' })
  }
}
