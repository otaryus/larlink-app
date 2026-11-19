import type { Repository } from '../ports/Repository'

export class InMemoryRepository<T extends { id: string }> implements Repository<T> {
  private readonly items = new Map<string, T>()

  constructor(initial: T[] = []) {
    initial.forEach((item) => this.items.set(item.id, structuredClone(item)))
  }

  async save(entity: T): Promise<void> {
    this.items.set(entity.id, structuredClone(entity))
  }

  async saveMany(entities: T[]): Promise<void> {
    entities.forEach((entity) => this.items.set(entity.id, structuredClone(entity)))
  }

  async findById(id: string): Promise<T | undefined> {
    const item = this.items.get(id)
    return item && structuredClone(item)
  }

  async findAll(): Promise<T[]> {
    return [...this.items.values()].map((item) => structuredClone(item))
  }
}
