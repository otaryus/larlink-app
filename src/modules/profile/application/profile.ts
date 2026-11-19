import type {
  ClientProfile,
  OwnProfile,
  WorkerProfileDraft,
} from '../domain/Profile'
import type { ProfileRepository } from '../ports/ProfileRepository'

export type ProfileKind = 'worker' | 'client'

export function makeLoadProfile(repository: ProfileRepository) {
  return async function loadProfile(kind: ProfileKind): Promise<OwnProfile> {
    return kind === 'worker' ? repository.loadWorker() : repository.loadClient()
  }
}

export type SaveProfileCommand =
  | { kind: 'worker'; profile: WorkerProfileDraft }
  | { kind: 'client'; profile: ClientProfile }

export function makeSaveProfile(repository: ProfileRepository) {
  return async function saveProfile(command: SaveProfileCommand): Promise<void> {
    if (command.kind === 'client') {
      await repository.saveClient(command.profile)
      return
    }

    await repository.saveWorker({
      ...command.profile,
      expectedSalary: Number(command.profile.expectedSalary),
      yearsOfExperience: Number(command.profile.yearsOfExperience),
    })
  }
}
