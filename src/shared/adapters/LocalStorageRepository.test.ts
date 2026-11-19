import { beforeEach, describe, expect, it } from 'vitest'
import { LocalStorageRepository } from './LocalStorageRepository'

describe('LocalStorageRepository', () => {
  beforeEach(() => localStorage.clear())

  it('saves, updates in place and lists entities', async () => {
    const repo = new LocalStorageRepository<{ id: string; v: number }>('test.items', localStorage)
    await repo.save({ id: 'a', v: 1 })
    await repo.save({ id: 'b', v: 2 })
    await repo.save({ id: 'a', v: 3 })

    expect(await repo.findAll()).toEqual([{ id: 'a', v: 3 }, { id: 'b', v: 2 }])
    expect(await repo.findById('b')).toEqual({ id: 'b', v: 2 })
    expect(await repo.findById('x')).toBeUndefined()
  })

  it('persists across instances using the same key', async () => {
    await new LocalStorageRepository('test.items', localStorage).save({ id: 'a' })
    expect(await new LocalStorageRepository('test.items', localStorage).findAll()).toHaveLength(1)
  })
})
