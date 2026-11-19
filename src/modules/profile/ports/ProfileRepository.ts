import type { ClientProfile, WorkerProfile } from '../domain/Profile'

export interface ProfileRepository {
  loadWorker(): Promise<WorkerProfile>
  loadClient(): Promise<ClientProfile>
  saveWorker(profile: WorkerProfile): Promise<void>
  saveClient(profile: ClientProfile): Promise<void>
}
