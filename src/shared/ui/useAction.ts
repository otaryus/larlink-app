import { useState } from 'react'
import { useContainer } from './ContainerContext'

export function useAction() {
  const { refresh } = useContainer()
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<unknown>) {
    setError(null)
    try {
      await action()
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocorreu um erro inesperado.')
    }
  }

  return { error, run }
}
