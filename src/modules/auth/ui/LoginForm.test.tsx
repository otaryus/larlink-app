import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createTestContainer, registrationData } from '../../../test/fixtures'
import { LoginForm } from './LoginForm'

async function setup() {
  const container = createTestContainer()
  await container.useCases.registerAccount(registrationData())
  container.useCases.signOut()
  const onSuccess = vi.fn()
  const user = userEvent.setup()
  render(<LoginForm onSubmit={container.useCases.signIn} onSuccess={onSuccess} />)
  return { container, user, onSuccess }
}

describe('LoginForm', () => {
  it('requires email and password', async () => {
    const { user, onSuccess } = await setup()
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Indique o email.')).toBeInTheDocument()
    expect(screen.getByText('Indique a palavra-passe.')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('validates the email format', async () => {
    const { user } = await setup()
    await user.type(screen.getByLabelText('Email'), 'carla')
    await user.type(screen.getByLabelText('Palavra-passe'), 'x')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Email inválido.')).toBeInTheDocument()
  })

  it('shows a generic error for wrong credentials', async () => {
    const { user, onSuccess } = await setup()
    await user.type(screen.getByLabelText('Email'), 'carla@exemplo.co.mz')
    await user.type(screen.getByLabelText('Palavra-passe'), 'Errada@123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou palavra-passe incorrectos.')
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('signs in with valid credentials', async () => {
    const { user, onSuccess, container } = await setup()
    await user.type(screen.getByLabelText('Email'), 'carla@exemplo.co.mz')
    await user.type(screen.getByLabelText('Palavra-passe'), 'Segura@123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(container.useCases.getSession()?.email).toBe('carla@exemplo.co.mz')
  })

  it('toggles password visibility', async () => {
    const { user } = await setup()
    const input = screen.getByLabelText('Palavra-passe')
    expect(input).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Mostrar palavra-passe' }))
    expect(input).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Ocultar palavra-passe' }))
    expect(input).toHaveAttribute('type', 'password')
  })
})
