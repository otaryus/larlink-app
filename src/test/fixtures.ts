import { ValidationError, type FieldErrors } from '../shared/domain/errors'
import { createContainer, createInMemoryRepositories, type Container } from '../app/container'
import { DEMO_ACCOUNT, loadMockData } from '../app/mockData'
import type { RegistrationData } from '../modules/auth/domain/Account'
import type { ClientData } from '../modules/clients/domain/Client'
import type { HousekeeperData } from '../modules/housekeepers/domain/Housekeeper'

export const NOW = new Date('2026-10-30T10:00:00Z')
export const TODAY = '2026-10-30'

export function clientData(overrides: Partial<ClientData> = {}): ClientData {
  return {
    name: 'Ana Machava',
    email: 'ana@exemplo.co.mz',
    phone: '84 123 4567',
    address: 'Av. Julius Nyerere, 1200',
    ...overrides,
  }
}

export function housekeeperData(overrides: Partial<HousekeeperData> = {}): HousekeeperData {
  return {
    name: 'Rosa Mabunda',
    birthDate: '1990-05-10',
    phone: '86 111 2233',
    city: 'Maputo',
    neighborhood: 'Polana Caniço',
    skills: ['CLEANING', 'COOKING'],
    availability: ['MON', 'WED', 'FRI'],
    expectedSalary: 7000,
    yearsOfExperience: 5,
    ...overrides,
  }
}

export function createTestContainer(now: Date = NOW): Container {
  let seq = 0
  return createContainer(createInMemoryRepositories(), {
    generateId: () => `id-${++seq}`,
    now: () => now,
  })
}

export async function seedClientAndApprovedHousekeeper(container: Container) {
  const { useCases } = container
  const client = await useCases.registerClient(clientData())
  const registered = await useCases.registerHousekeeper(housekeeperData())
  const housekeeper = await useCases.reviewProfile({ housekeeperId: registered.id, decision: 'APPROVE' })
  return { client, housekeeper }
}

export async function seedActiveContract(container: Container) {
  const { client, housekeeper } = await seedClientAndApprovedHousekeeper(container)
  const { useCases } = container
  const request = await useCases.submitHireRequest({
    clientId: client.id,
    housekeeperId: housekeeper.id,
    requiredSkills: ['CLEANING'],
    requiredDays: ['MON'],
    startDate: TODAY,
    notes: '',
  })
  await useCases.decideHireRequest({ hireRequestId: request.id, decision: 'APPROVE' })
  const contract = await useCases.signContract({ hireRequestId: request.id, monthlySalary: 7000, durationMonths: 3 })
  return { client, housekeeper, request, contract }
}

export function fieldErrorsOf(fn: () => unknown): FieldErrors {
  try {
    fn()
  } catch (error) {
    if (error instanceof ValidationError) return error.fields
    throw error
  }
  throw new Error('Expected a ValidationError')
}

export async function createMockContainer({ signedIn = true } = {}): Promise<Container> {
  const repositories = createInMemoryRepositories()
  await loadMockData(repositories, NOW)
  let seq = 0
  const container = createContainer(repositories, { generateId: () => `new-${++seq}`, now: () => NOW })
  if (signedIn) await container.useCases.signIn({ email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password })
  return container
}

export function registrationData(overrides: Partial<RegistrationData> = {}): RegistrationData {
  return {
    name: 'Carla Nhantumbo',
    email: 'carla@exemplo.co.mz',
    role: 'CLIENT',
    password: 'Segura@123',
    passwordConfirmation: 'Segura@123',
    acceptTerms: true,
    ...overrides,
  }
}
