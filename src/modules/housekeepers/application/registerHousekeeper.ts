import { ValidationError } from '../../../shared/domain/errors'
import type { Clock, IdGenerator } from '../../../shared/ports/services'
import { createHousekeeper, type Housekeeper, type HousekeeperData } from '../domain/Housekeeper'
import type { HousekeeperRepository } from '../ports/HousekeeperRepository'

export type RegisterHousekeeperCommand = HousekeeperData

export interface RegisterHousekeeperDeps {
  housekeepers: HousekeeperRepository
  generateId: IdGenerator
  now: Clock
}

export function makeRegisterHousekeeper({ housekeepers, generateId, now }: RegisterHousekeeperDeps) {
  return async function registerHousekeeper(command: RegisterHousekeeperCommand): Promise<Housekeeper> {
    const housekeeper = createHousekeeper(command, generateId(), now())
    const existing = await housekeepers.findAll()
    if (existing.some((h) => h.phone === housekeeper.phone))
      throw new ValidationError({ phone: 'Já existe um perfil com este telemóvel.' })
    await housekeepers.save(housekeeper)
    return housekeeper
  }
}
