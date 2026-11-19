import { describe, expect, it, vi } from 'vitest'
import type { ClientProfile, WorkerProfile } from '../domain/Profile'
import type { ProfileRepository } from '../ports/ProfileRepository'
import { makeLoadProfile, makeSaveProfile } from './profile'

const workerProfile: WorkerProfile = {
  birthDate: '1990-01-02',
  phone: '841234567',
  city: 'Maputo',
  neighborhood: 'Polana',
  skills: ['CLEANING'],
  availability: ['MON'],
  expectedSalary: 7000,
  yearsOfExperience: 3,
}

const clientProfile: ClientProfile = { phone: '841234567', address: 'Rua 1, Maputo' }

function repository(): ProfileRepository {
  return {
    loadWorker: vi.fn(async () => workerProfile),
    loadClient: vi.fn(async () => clientProfile),
    saveWorker: vi.fn(async () => {}),
    saveClient: vi.fn(async () => {}),
  }
}

describe('profile use cases', () => {
  it('loads the profile matching the authenticated role', async () => {
    const profiles = repository()

    await expect(makeLoadProfile(profiles)('worker')).resolves.toEqual(workerProfile)
    await expect(makeLoadProfile(profiles)('client')).resolves.toEqual(clientProfile)
    expect(profiles.loadWorker).toHaveBeenCalledOnce()
    expect(profiles.loadClient).toHaveBeenCalledOnce()
  })

  it('normalizes numeric worker fields before saving', async () => {
    const profiles = repository()
    const form = { ...workerProfile, expectedSalary: '7500', yearsOfExperience: '4' }

    await makeSaveProfile(profiles)({ kind: 'worker', profile: form })

    expect(profiles.saveWorker).toHaveBeenCalledWith({
      ...workerProfile,
      expectedSalary: 7500,
      yearsOfExperience: 4,
    })
  })

  it('saves client contact details without changing them', async () => {
    const profiles = repository()

    await makeSaveProfile(profiles)({ kind: 'client', profile: clientProfile })

    expect(profiles.saveClient).toHaveBeenCalledWith(clientProfile)
  })
})
