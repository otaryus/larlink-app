import { createContext, useContext, useState, type ReactNode } from 'react'
import { api, json, setToken, type ApiAccount } from '../../../shared/api/client'
import type { RegisterAccountCommand, SignInCommand } from '../application/authentication'
import type { Role, Session } from '../domain/Account'

interface AuthValue {
  session: Session | null
  signIn: (command: SignInCommand) => Promise<Session>
  register: (command: RegisterAccountCommand) => Promise<Session>
  updateRole: (role: Role) => void
  changePassword: (password: string, confirmation: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthValue | null>(null)
const SESSION_KEY = 'larlink.session'
function roleForUi(role: string): Role { return role === 'AGENT' ? 'AGENCY' : role as Role }
function saveAccount(account: ApiAccount): Session {
  setToken(account.token)
  const session = { accountId: account.id, name: account.name, email: account.email, role: roleForUi(account.role), signedInAt: new Date().toISOString(), mustChangePassword: account.mustChangePassword }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}
function loadSession(): Session | null {
  if (!localStorage.getItem('larlink.token')) return null
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as Session | null } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession)
  const value: AuthValue = {
    session,
    signIn: async (command) => {
      const account = await api<ApiAccount>('/api/auth/login', json(command))
      const started = saveAccount(account)
      setSession(started)
      return started
    },
    register: async (command) => {
      const form = new FormData()
      form.append('account', new Blob([JSON.stringify({ name: command.name, email: command.email, role: command.role, password: command.password, acceptTerms: command.acceptTerms })], { type: 'application/json' }))
      if (command.photo) form.append('photo', command.photo)
      const account = await api<ApiAccount>('/api/auth/register', { method: 'POST', body: form })
      const started = saveAccount(account)
      setSession(started)
      return started
    },
    updateRole: (role) => setSession((current) => {
      if (!current) return current
      const updated = { ...current, role }
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
      return updated
    }),
    changePassword: async (password, confirmation) => {
      await api('/api/auth/change-password', json({ password, confirmation }))
      setSession((current) => {
        if (!current) return current
        const updated = { ...current, mustChangePassword: false }
        localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
        return updated
      })
    },
    signOut: () => {
      setToken(null)
      localStorage.removeItem(SESSION_KEY)
      setSession(null)
    },
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
