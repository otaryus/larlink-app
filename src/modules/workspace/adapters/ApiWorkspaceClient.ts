import { api, downloadApiFile, json } from '../../../shared/api/client'
import type { WorkspaceClientProfile, WorkspaceWorker } from '../domain/Workspace'
import type { MatchingCriteria, WorkerWorkspaceProfile, WorkspaceApi } from '../ports/WorkspaceApi'

export class ApiWorkspaceClient implements WorkspaceApi {
  request<T>(path: string, options?: RequestInit): Promise<T> {
    return api<T>(path, options)
  }

  download(path: string, filename: string): Promise<void> {
    return downloadApiFile(path, filename)
  }

  findMatches(criteria: MatchingCriteria): Promise<WorkspaceWorker[]> {
    return api('/api/matching', json(criteria))
  }

  async saveClientProfile(profile: WorkspaceClientProfile): Promise<void> {
    await api('/api/clients/profile', json(profile))
  }

  saveWorkerProfile(input: {
    profile: Omit<WorkerWorkspaceProfile, 'expectedSalary' | 'yearsOfExperience'> & { expectedSalary: number; yearsOfExperience: number }
    existing: boolean
  }): Promise<WorkspaceWorker> {
    const { profile, existing } = input
    return api(existing ? '/api/housekeepers/me' : '/api/housekeepers/profile', {
      ...json(profile),
      method: existing ? 'PUT' : 'POST',
    })
  }

  async saveWorkerPhoto(form: FormData): Promise<void> {
    await api('/api/housekeepers/me/photo', { method: 'PUT', body: form })
  }
}
