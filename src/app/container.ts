import {
  makeGetSession,
  makeRegisterAccount,
  makeSignIn,
  makeSignOut,
} from '../modules/auth/application/authentication'
import { Sha256PasswordHasher } from '../modules/auth/adapters/Sha256PasswordHasher'
import { InMemorySessionStore } from '../modules/auth/adapters/sessionStores'
import type { AccountRepository } from '../modules/auth/ports/AccountRepository'
import type { PasswordHasher } from '../modules/auth/ports/PasswordHasher'
import type { SessionStore } from '../modules/auth/ports/SessionStore'
import { InMemoryRepository } from '../shared/adapters/InMemoryRepository'
import { LocalStorageRepository } from '../shared/adapters/LocalStorageRepository'
import type { Clock, IdGenerator } from '../shared/ports/services'
import { makeRegisterClient } from '../modules/clients/application/registerClient'
import type { ClientRepository } from '../modules/clients/ports/ClientRepository'
import { ContractAvailabilityAdapter } from '../modules/contracts/adapters/ContractAvailabilityAdapter'
import { makeEndContract } from '../modules/contracts/application/endContract'
import { makeSignContract } from '../modules/contracts/application/signContract'
import type { ContractRepository } from '../modules/contracts/ports/ContractRepository'
import { makeRegisterHousekeeper } from '../modules/housekeepers/application/registerHousekeeper'
import { makeReviewProfile } from '../modules/housekeepers/application/reviewProfile'
import type { HousekeeperRepository } from '../modules/housekeepers/ports/HousekeeperRepository'
import { makeRegisterPayment } from '../modules/payments/application/registerPayment'
import type { PaymentRepository } from '../modules/payments/ports/PaymentRepository'
import { makeDecideHireRequest } from '../modules/placement/application/decideHireRequest'
import { makeSearchHousekeepers } from '../modules/placement/application/searchHousekeepers'
import { makeSubmitHireRequest } from '../modules/placement/application/submitHireRequest'
import type { HireRequestRepository } from '../modules/placement/ports/HireRequestRepository'
import { makeGetDashboard } from '../modules/reports/application/getDashboard'
import { makeSubmitReview } from '../modules/reviews/application/submitReview'
import type { ReviewRepository } from '../modules/reviews/ports/ReviewRepository'

export interface Repositories {
  accounts: AccountRepository
  clients: ClientRepository
  housekeepers: HousekeeperRepository
  hireRequests: HireRequestRepository
  contracts: ContractRepository
  payments: PaymentRepository
  reviews: ReviewRepository
}

export interface Services {
  generateId: IdGenerator
  now: Clock
  passwordHasher?: PasswordHasher
  sessionStore?: SessionStore
}

export function createInMemoryRepositories(): Repositories {
  return {
    accounts: new InMemoryRepository(),
    clients: new InMemoryRepository(),
    housekeepers: new InMemoryRepository(),
    hireRequests: new InMemoryRepository(),
    contracts: new InMemoryRepository(),
    payments: new InMemoryRepository(),
    reviews: new InMemoryRepository(),
  }
}

export function createLocalStorageRepositories(storage?: Storage): Repositories {
  return {
    accounts: new LocalStorageRepository('agency.accounts', storage),
    clients: new LocalStorageRepository('agency.clients', storage),
    housekeepers: new LocalStorageRepository('agency.housekeepers', storage),
    hireRequests: new LocalStorageRepository('agency.hireRequests', storage),
    contracts: new LocalStorageRepository('agency.contracts', storage),
    payments: new LocalStorageRepository('agency.payments', storage),
    reviews: new LocalStorageRepository('agency.reviews', storage),
  }
}

const defaultServices: Services = {
  generateId: () => crypto.randomUUID(),
  now: () => new Date(),
}

export function createContainer(repositories: Repositories, services: Services = defaultServices) {
  const availability = new ContractAvailabilityAdapter(repositories.contracts)
  const deps = {
    ...repositories,
    ...services,
    availability,
    passwordHasher: services.passwordHasher ?? new Sha256PasswordHasher(),
    sessionStore: services.sessionStore ?? new InMemorySessionStore(),
  }
  return {
    repositories,
    useCases: {
      registerAccount: makeRegisterAccount(deps),
      signIn: makeSignIn(deps),
      signOut: makeSignOut(deps),
      getSession: makeGetSession(deps),
      registerClient: makeRegisterClient(deps),
      registerHousekeeper: makeRegisterHousekeeper(deps),
      reviewProfile: makeReviewProfile(deps),
      searchHousekeepers: makeSearchHousekeepers(deps),
      submitHireRequest: makeSubmitHireRequest(deps),
      decideHireRequest: makeDecideHireRequest(deps),
      signContract: makeSignContract(deps),
      endContract: makeEndContract(deps),
      registerPayment: makeRegisterPayment(deps),
      submitReview: makeSubmitReview(deps),
      getDashboard: makeGetDashboard(deps),
    },
  }
}

export type Container = ReturnType<typeof createContainer>
