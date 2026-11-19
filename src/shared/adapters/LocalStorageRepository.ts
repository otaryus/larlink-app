import type { Repository } from '../ports/Repository'

export class LocalStorageRepository<T extends { id: string }> implements Repository<T> {
  private readonly key: string
  private readonly storage: Storage

  constructor(key: string, storage: Storage = window.localStorage) {
    this.key = key
    this.storage = storage
  }

  private read(): T[] {
    return JSON.parse(this.storage.getItem(this.key) ?? '[]') as T[]
  }

  async save(entity: T): Promise<void> {
    await this.saveMany([entity])
  }

  async saveMany(entities: T[]): Promise<void> {
    const items = this.read()
    for (const entity of entities) {
      const index = items.findIndex((item) => item.id === entity.id)
      if (index >= 0) items[index] = entity
      else items.push(entity)
    }
    this.storage.setItem(this.key, JSON.stringify(items))
  }

  async findById(id: string): Promise<T | undefined> {
    return this.read().find((item) => item.id === id)
  }

  async findAll(): Promise<T[]> {
    return this.read()
  }
}
