import type { Skill, Weekday } from '../../housekeepers/domain/Housekeeper'

export interface WorkerProfile {
  birthDate: string
  phone: string
  city: string
  neighborhood: string
  skills: Skill[]
  availability: Weekday[]
  expectedSalary: number
  yearsOfExperience: number
}

export type WorkerProfileDraft = Omit<WorkerProfile, 'expectedSalary' | 'yearsOfExperience'> & {
  expectedSalary: number | string
  yearsOfExperience: number | string
}

export interface ClientProfile {
  phone: string
  address: string
}

export type OwnProfile = WorkerProfile | ClientProfile
