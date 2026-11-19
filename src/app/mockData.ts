import { toISODate } from '../shared/domain/dates'
import { Sha256PasswordHasher } from '../modules/auth/adapters/Sha256PasswordHasher'
import { createAccount } from '../modules/auth/domain/Account'
import type { PasswordHasher } from '../modules/auth/ports/PasswordHasher'
import { createClient, type Client } from '../modules/clients/domain/Client'
import { createContract, terminateContract, type Contract } from '../modules/contracts/domain/Contract'
import {
  approveProfile,
  createHousekeeper,
  type Housekeeper,
  type HousekeeperData,
} from '../modules/housekeepers/domain/Housekeeper'
import { createPayment, type Payment } from '../modules/payments/domain/Payment'
import { approveHireRequest, createHireRequest, type HireRequest } from '../modules/placement/domain/HireRequest'
import { createReview, type Review } from '../modules/reviews/domain/Review'
import type { Repositories } from './container'

export interface MockDataset {
  clients: Client[]
  housekeepers: Housekeeper[]
  hireRequests: HireRequest[]
  contracts: Contract[]
  payments: Payment[]
  reviews: Review[]
}

const CLIENTS = [
  { name: 'Carlos Mabunda', email: 'carlos.mabunda@exemplo.co.mz', phone: '845000001', address: 'Sommerschield, casa 10' },
  { name: 'Ivone Sitoe', email: 'ivone.sitoe@exemplo.co.mz', phone: '845000002', address: 'Polana Caniço, casa 22' },
  { name: 'Paulo Macuácua', email: 'paulo.macuacua@exemplo.co.mz', phone: '845000003', address: 'Fomento, Matola, casa 5' },
  { name: 'Dulce Chirindza', email: 'dulce.chirindza@exemplo.co.mz', phone: '845000004', address: 'Coop, casa 41' },
  { name: 'Alberto Novela', email: 'alberto.novela@exemplo.co.mz', phone: '845000005', address: 'Malhangalene, casa 8' },
]

const base = { birthDate: '1990-01-01', availability: ['MON', 'TUE', 'WED', 'THU', 'FRI'] as HousekeeperData['availability'] }

const HOUSEKEEPERS: [string, HousekeeperData, number, boolean][] = [
  ['hk-ana', { ...base, name: 'Ana Carlos', birthDate: '1991-04-12', phone: '841110001', city: 'Maputo', neighborhood: 'Sommerschield', skills: ['CLEANING', 'COOKING', 'ELDERLY_CARE'], expectedSalary: 8000, yearsOfExperience: 5 }, 25, true],
  ['hk-beatriz', { ...base, name: 'Beatriz Matusse', birthDate: '1995-09-03', phone: '851110002', city: 'Matola', neighborhood: 'Fomento', skills: ['CLEANING', 'COOKING'], expectedSalary: 6500, yearsOfExperience: 3 }, 22, true],
  ['hk-helena', { ...base, name: 'Helena Quissanga', birthDate: '1993-02-21', phone: '861110003', city: 'Maputo', neighborhood: 'Malhangalene', skills: ['CLEANING', 'COOKING', 'CHILDCARE'], expectedSalary: 7000, yearsOfExperience: 4 }, 20, true],
  ['hk-lucia', { ...base, name: 'Lúcia Mondlane', birthDate: '1990-05-27', phone: '861110008', city: 'Maputo', neighborhood: 'Central', skills: ['CLEANING', 'LAUNDRY'], expectedSalary: 7000, yearsOfExperience: 7 }, 18, true],
  ['hk-graca', { ...base, name: 'Graça Bila', birthDate: '1987-06-30', phone: '871110004', city: 'Maputo', neighborhood: 'Coop', skills: ['CLEANING', 'GARDENING'], expectedSalary: 6000, yearsOfExperience: 9 }, 15, true],
  ['hk-maria', { ...base, name: 'Maria Langa', birthDate: '1989-11-15', phone: '821110005', city: 'Maputo', neighborhood: 'Polana Caniço', skills: ['CHILDCARE', 'CLEANING'], expectedSalary: 7500, yearsOfExperience: 6 }, 14, true],
  ['hk-joana', { ...base, name: 'Joana Cossa', birthDate: '1998-03-08', phone: '841110009', city: 'Matola', neighborhood: 'Machava', skills: ['COOKING'], expectedSalary: 5500, yearsOfExperience: 1 }, 3, false],
  ['hk-rita', { ...base, name: 'Rita Nhaca', birthDate: '1996-12-01', phone: '851110010', city: 'Beira', neighborhood: 'Ponta Gêa', skills: ['ELDERLY_CARE', 'CLEANING'], expectedSalary: 6000, yearsOfExperience: 2 }, 1, false],
]

export function buildMockData(now: Date): MockDataset {
  const dayOfMonth = now.getUTCDate()
  const daysAgo = (n: number) => new Date(now.getTime() - Math.min(n, dayOfMonth - 1) * 86_400_000 - 3_600_000)

  const data: MockDataset = { clients: [], housekeepers: [], hireRequests: [], contracts: [], payments: [], reviews: [] }

  CLIENTS.forEach((c, i) => data.clients.push(createClient(c, `cli-${i + 1}`, daysAgo(26 - i * 5))))
  for (const [id, d, ago, approved] of HOUSEKEEPERS) {
    const h = createHousekeeper(d, id, daysAgo(ago))
    data.housekeepers.push(approved ? approveProfile(h) : h)
  }

  const byId = new Map(data.housekeepers.map((h) => [h.id, h]))
  let seq = 0
  const request = (clientIndex: number, housekeeperId: string, at: Date) => {
    const h = byId.get(housekeeperId)!
    return createHireRequest(
      { clientId: data.clients[clientIndex].id, housekeeperId, requiredSkills: [h.skills[0]], requiredDays: [h.availability[0]], startDate: toISODate(at), notes: '' },
      h,
      `req-${++seq}`,
      at,
    )
  }
  const sign = (housekeeperId: string, clientIndex: number, at: Date, durationMonths: number) => {
    const h = byId.get(housekeeperId)!
    const approved = approveHireRequest(request(clientIndex, housekeeperId, at))
    const contract = createContract({ hireRequestId: approved.id, monthlySalary: h.expectedSalary + 500, durationMonths }, approved, h, `ctr-${seq}`, at)
    const payment = createPayment({ contractId: contract.id, referenceMonth: contract.startDate.slice(0, 7), method: 'MPESA', account: '841234567' }, contract, [], `pay-${seq}`, at)
    data.hireRequests.push(approved)
    data.payments.push(payment)
    return contract
  }

  const ana = terminateContract(sign('hk-ana', 0, daysAgo(20), 1), daysAgo(6))
  const lucia = sign('hk-lucia', 1, daysAgo(10), 6)
  data.contracts.push(ana, lucia)
  data.hireRequests.push(approveHireRequest(request(2, 'hk-graca', daysAgo(8))))
  data.hireRequests.push(request(3, 'hk-maria', daysAgo(5)))

  data.reviews.push(
    createReview({ contractId: ana.id, rating: 5, comment: 'Muito pontual e cuidadosa com a casa.' }, ana, 1, 'rev-1', daysAgo(6)),
    createReview({ contractId: lucia.id, rating: 4, comment: 'Organizada e de confiança.' }, lucia, 1, 'rev-2', daysAgo(4)),
  )
  const history: [string, number, string][] = [
    ['hk-ana', 5, 'Cozinha muito bem, a família adorou.'],
    ['hk-ana', 4, ''],
    ['hk-helena', 5, 'Excelente com as crianças, recomendo.'],
    ['hk-helena', 5, ''],
    ['hk-beatriz', 4, 'Simpática e trabalhadora.'],
  ]
  history.forEach(([housekeeperId, rating, comment], i) =>
    data.reviews.push({ id: `rev-h${i + 1}`, contractId: `historico-${i + 1}`, housekeeperId, clientId: data.clients[i % CLIENTS.length].id, rating, comment, createdAt: daysAgo(12 - i).toISOString() }),
  )

  return data
}

export const DEMO_ACCOUNT = {
  name: 'Ladino Anselmo',
  email: 'admin@larlink.co.mz',
  password: 'teste@123',
  role: 'AGENCY',
} as const

export async function loadMockData(
  repositories: Repositories,
  now: Date = new Date(),
  passwordHasher: PasswordHasher = new Sha256PasswordHasher(),
): Promise<void> {
  const data = buildMockData(now)
  const demo = createAccount(
    { ...DEMO_ACCOUNT, passwordConfirmation: DEMO_ACCOUNT.password, acceptTerms: true },
    await passwordHasher.hash(DEMO_ACCOUNT.password),
    'acc-demo',
    now,
  )
  await Promise.all([
    repositories.accounts.saveMany([demo]),
    repositories.clients.saveMany(data.clients),
    repositories.housekeepers.saveMany(data.housekeepers),
    repositories.hireRequests.saveMany(data.hireRequests),
    repositories.contracts.saveMany(data.contracts),
    repositories.payments.saveMany(data.payments),
    repositories.reviews.saveMany(data.reviews),
  ])
}

export function clearAgencyStorage(storage: Storage = window.localStorage): void {
  Object.keys(storage)
    .filter((key) => key.startsWith('agency.') && !['agency.session', 'agency.accounts'].includes(key))
    .forEach((key) => storage.removeItem(key))
}
