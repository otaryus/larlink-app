import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const location = useLocation()
  if (!session) return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />
  if (session.mustChangePassword && location.pathname !== '/actualizar-senha') return <Navigate to="/actualizar-senha" replace />
  if (!session.mustChangePassword && location.pathname === '/actualizar-senha') return <Navigate to="/" replace />
  return children
}

export function AnonymousOnly({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  if (session) return <Navigate to={from} replace />
  return children
}
