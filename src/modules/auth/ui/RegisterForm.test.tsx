import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createTestContainer, registrationData } from '../../../test/fixtures'
import { RegisterForm } from './RegisterForm'

function setup() {
  const container = createTestContainer()
  const onSuccess = vi.fn()
  const user = userEvent.setup()
  render(<RegisterForm onSubmit={container.useCases.registerAccount} onSuccess={onSuccess} />)
  return { container, user, onSuccess }
}

async function fill(user: ReturnType<typeof userEvent.setup>, overrides: { password?: string; confirmation?: string; photo?: boolean } = {}) {
  await user.type(screen.getByLabelText('Nome completo'), 'Carla Nhantumbo')
  if (overrides.photo !== false) await user.upload(screen.getByLabelText(/Fotografia de perfil/), new File(['foto de teste'], 'perfil.png', { type: 'image/png' }))
  await user.type(screen.getByLabelText('Email'), 'carla@exemplo.co.mz')
  await user.selectOptions(screen.getByLabelText('Tipo de conta'), 'Cliente')
  await user.type(screen.getByLabelText('Palavra-passe'), overrides.password ?? 'Segura@123')
  await user.type(screen.getByLabelText('Confirmar palavra-passe'), overrides.confirmation ?? 'Segura@123')
  await user.click(screen.getByLabelText(/Aceito os termos/))
}

describe('RegisterForm', () => {
  it('shows an error for every invalid field', async () => {
    const { user, onSuccess } = setup()
    await user.upload(screen.getByLabelText(/Fotografia de perfil/), new File(['foto de teste'], 'perfil.png', { type: 'image/png' }))
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByText('Indique o nome completo (nome e apelido).')).toBeInTheDocument()
    expect(screen.getByText('Email inválido.')).toBeInTheDocument()
    expect(screen.getByText('Seleccione o tipo de conta.')).toBeInTheDocument()
    expect(screen.getByText(/A palavra-passe deve ter 8\+ caracteres/)).toBeInTheDocument()
    expect(screen.getByText('Confirme a palavra-passe.')).toBeInTheDocument()
    expect(screen.getByText('Tem de aceitar os termos de utilização.')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('requires a profile photo before submitting', async () => {
    const { user, onSuccess } = setup()
    await fill(user, { photo:false })
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByText('Carregue uma fotografia de perfil para continuar.')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('updates the password checklist while typing', async () => {
    const { user } = setup()
    const rules = screen.getByRole('list', { name: 'Requisitos da palavra-passe' })
    const met = () => within(rules).getAllByRole('listitem').filter((li) => li.dataset.met === 'true').length
    expect(met()).toBe(0)
    await user.type(screen.getByLabelText('Palavra-passe'), 'abc')
    expect(met()).toBe(1)
    await user.type(screen.getByLabelText('Palavra-passe'), 'DE@12')
    expect(met()).toBe(4)
  })

  it('rejects a confirmation that does not match', async () => {
    const { user } = setup()
    await fill(user, { confirmation: 'Segura@124' })
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByText('As palavras-passe não coincidem.')).toBeInTheDocument()
  })

  it('rejects an email already registered', async () => {
    const { user, container } = setup()
    await container.useCases.registerAccount(registrationData())
    await fill(user)
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByText('Já existe uma conta com este email.')).toBeInTheDocument()
  })

  it('creates the account', async () => {
    const { user, container, onSuccess } = setup()
    await fill(user)
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(onSuccess).toHaveBeenCalledOnce()
    expect((await container.repositories.accounts.findAll())[0]).toMatchObject({ email: 'carla@exemplo.co.mz', role: 'CLIENT' })
  })
})
