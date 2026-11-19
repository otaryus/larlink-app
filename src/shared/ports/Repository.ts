export interface Repository<T extends { id: string }> {
  save(entity: T): Promise<void>
  saveMany(entities: T[]): Promise<void>
  findById(id: string): Promise<T | undefined>
  findAll(): Promise<T[]>
}
