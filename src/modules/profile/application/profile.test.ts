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

    expect(profiles.saveClient).toHaveBeenCalledWith({ ...clientProfile, phone: '841234567' })
  })

  it('does not send invalid client data to the repository', async () => {
    const profiles = repository()
    const saveProfile = makeSaveProfile(profiles)

    await expect(saveProfile({ kind: 'client', profile: { phone: '123', address: 'abc' } }))
      .rejects.toMatchObject({
        fields: {
          phone: 'Indique um telemóvel moçambicano válido.',
          address: 'O endereço deve ter entre 5 e 500 caracteres.',
        },
      })
    expect(profiles.saveClient).not.toHaveBeenCalled()
  })

  it('does not send invalid worker data to the repository', async () => {
    const profiles = repository()
    const saveProfile = makeSaveProfile(profiles)

    await expect(saveProfile({
      kind: 'worker',
      profile: { ...workerProfile, expectedSalary: '5001', yearsOfExperience: '51', skills: [], availability: [] },
    })).rejects.toMatchObject({
      fields: {
        expectedSalary: expect.any(String),
        yearsOfExperience: expect.any(String),
        skills: expect.any(String),
        availability: expect.any(String),
      },
    })
    expect(profiles.saveWorker).not.toHaveBeenCalled()
  })
})
