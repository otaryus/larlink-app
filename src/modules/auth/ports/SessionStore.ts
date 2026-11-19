import type { Session } from '../domain/Account'

export interface SessionStore {
  load(): Session | null
  save(session: Session): void
  clear(): void
}
