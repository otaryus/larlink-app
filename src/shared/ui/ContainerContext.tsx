import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Container } from '../../app/container'

interface ContextValue {
  container: Container
  version: number
  refresh: () => void
}

const ContainerContext = createContext<ContextValue | null>(null)

export function ContainerProvider({ container, children }: { container: Container; children: ReactNode }) {
  const [version, setVersion] = useState(0)
  const refresh = useCallback(() => setVersion((v) => v + 1), [])
  return (
    <ContainerContext.Provider value={{ container, version, refresh }}>{children}</ContainerContext.Provider>
  )
}

export function useContainer(): ContextValue {
  const value = useContext(ContainerContext)
  if (!value) throw new Error('useContainer must be used inside ContainerProvider')
  return value
}

export function useQuery<T>(load: (c: Container) => Promise<T>, initial: T, deps: unknown[] = []): T {
  const { container, version } = useContainer()
  const [data, setData] = useState<T>(initial)
  useEffect(() => {
    let active = true
    load(container).then((result) => {
      if (active) setData(result)
    })
    return () => {
      active = false
    }
  }, [container, version, ...deps])
  return data
}
