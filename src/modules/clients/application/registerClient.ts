import { ValidationError } from '../../../shared/domain/errors'
import type { Clock, IdGenerator } from '../../../shared/ports/services'
import { createClient, type Client, type ClientData } from '../domain/Client'
import type { ClientRepository } from '../ports/ClientRepository'

export type RegisterClientCommand = ClientData

export interface RegisterClientDeps {
  clients: ClientRepository
  generateId: IdGenerator
  now: Clock
}

export function makeRegisterClient({ clients, generateId, now }: RegisterClientDeps) {
  return async function registerClient(command: RegisterClientCommand): Promise<Client> {
    const client = createClient(command, generateId(), now())
    const existing = await clients.findAll()
    if (existing.some((c) => c.email === client.email))
      throw new ValidationError({ email: 'Já existe um cliente com este email.' })
    await clients.save(client)
    return client
  }
}
