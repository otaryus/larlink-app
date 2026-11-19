import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithApp } from '../test/render'
import { App } from './App'

describe('JWT app shell', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      token: 'test-token', id: 'agent-1', name: 'Gestor LarLink', email: 'gestor@larlink.co.mz', role: 'AGENT', mustChangePassword: false,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))
  })

  it('redirects protected routes to login for anonymous visitors', async () => {
    renderWithApp(<App />, { route: '/contratos' })
    expect(await screen.findByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument()
  })

  it('authenticates through the backend and stores the JWT session', async () => {
    const { user } = renderWithApp(<App />, { route: '/entrar' })
    await user.type(screen.getByLabelText('Email'), 'gestor@larlink.co.mz')
    await user.type(screen.getByLabelText('Palavra-passe'), 'G3stor!LarLink#91')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Gestor LarLink')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Data e hora' })).toHaveAttribute('href', '/data-hora')
    expect(localStorage.getItem('larlink.token')).toBe('test-token')
    expect(JSON.parse(localStorage.getItem('larlink.session')!).role).toBe('AGENCY')
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/login'), expect.objectContaining({ method: 'POST' }))
  })
})
