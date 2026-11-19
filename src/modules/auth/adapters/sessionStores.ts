import type { Session } from '../domain/Account'
import type { SessionStore } from '../ports/SessionStore'

export class InMemorySessionStore implements SessionStore {
  private session: Session | null = null

  load(): Session | null {
    return this.session
  }

  save(session: Session): void {
    this.session = session
  }

  clear(): void {
    this.session = null
  }
}

export class LocalStorageSessionStore implements SessionStore {
  private readonly key: string
  private readonly storage: Storage

  constructor(key = 'agency.session', storage: Storage = window.localStorage) {
    this.key = key
    this.storage = storage
  }

  load(): Session | null {
    try {
      return JSON.parse(this.storage.getItem(this.key) ?? 'null') as Session | null
    } catch {
      return null
    }
  }

  save(session: Session): void {
    this.storage.setItem(this.key, JSON.stringify(session))
  }

  clear(): void {
    this.storage.removeItem(this.key)
  }
}
