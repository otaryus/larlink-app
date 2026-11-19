import type { WorkspaceClientProfile, WorkspaceWorker } from '../domain/Workspace'

export interface MatchingCriteria {
  city: string
  district: string
  neighborhood?: string
  skills: string[]
  availability: string[]
  maxSalary?: number
  text?: string
}

export interface WorkerWorkspaceProfile {
  birthDate: string
  phone: string
  city: string
  district: string
  neighborhood: string
  skills: string[]
  availability: string[]
  expectedSalary: number | string
  yearsOfExperience: number | string
}

export interface WorkspaceApi {
  request<T>(path: string, options?: RequestInit): Promise<T>
  download(path: string, filename: string): Promise<void>
  findMatches(criteria: MatchingCriteria): Promise<WorkspaceWorker[]>
  saveClientProfile(profile: WorkspaceClientProfile): Promise<void>
  saveWorkerProfile(input: { profile: Omit<WorkerWorkspaceProfile, 'expectedSalary' | 'yearsOfExperience'> & { expectedSalary: number; yearsOfExperience: number }; existing: boolean }): Promise<WorkspaceWorker>
  saveWorkerPhoto(form: FormData): Promise<void>
}
