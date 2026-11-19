export function byNewest<T extends { createdAt: string }>(a: T, b: T): number {
  return b.createdAt.localeCompare(a.createdAt)
}

export function newestFirst<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort(byNewest)
}
