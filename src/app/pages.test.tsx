import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithApp } from '../test/render'
import { App } from './App'

function authenticatedAs(role: string) {
  localStorage.setItem('larlink.token', 'role-test-token')
  localStorage.setItem('larlink.session', JSON.stringify({ accountId: 'account-1', name: 'Conta de teste', email: 'teste@larlink.co.mz', role, signedInAt: new Date().toISOString(), mustChangePassword: false }))
}

describe('role-specific workspace', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/agent/dashboard')) return new Response(JSON.stringify({ totalCandidates: 0, pendingProfiles: 0, approvedProfiles: 0, pendingRequests: 0, totalClients: 0, totalContracts: 0, openIncidents: 0 }), { status: 200 })
      if (url.includes('/api/housekeepers/me')) return new Response(JSON.stringify({ message: 'Perfil ainda não criado' }), { status: 404 })
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }))
  })

  it('shows agency operations to agents', async () => {
    authenticatedAs('AGENCY')
    renderWithApp(<App />, { route: '/' })
    expect(await screen.findByRole('heading', { level: 1, name: 'Painel da agência' })).toBeInTheDocument()
    const navigation = screen.getByRole('navigation')
    expect(within(navigation).getByRole('link', { name: /Candidatas/ })).toBeInTheDocument()
    expect(within(navigation).getByRole('link', { name: /Contratos/ })).toBeInTheDocument()
  })

  it('shows profile onboarding for candidates without a worker profile', async () => {
    authenticatedAs('CANDIDATE')
    renderWithApp(<App />, { route: '/' })
    expect(await screen.findByRole('heading', { level: 1, name: 'Comece o seu perfil' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar perfil para análise' })).toBeInTheDocument()
  })
})
