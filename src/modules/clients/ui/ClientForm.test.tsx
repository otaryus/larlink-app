import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createTestContainer } from '../../../test/fixtures'
import { ClientForm } from './ClientForm'

describe('ClientForm', () => {
  it('shows the domain validation errors next to each field', async () => {
    const user = userEvent.setup()
    const { useCases } = createTestContainer()
    render(<ClientForm onSubmit={useCases.registerClient} />)

    await user.click(screen.getByRole('button', { name: 'Registar cliente' }))

    expect(await screen.findByText('Indique o nome completo (nome e apelido).')).toBeInTheDocument()
    expect(screen.getByText('Email inválido.')).toBeInTheDocument()
    expect(screen.getByText(/Telemóvel moçambicano inválido/)).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('registers a valid client, calls onSuccess and clears the form', async () => {
    const user = userEvent.setup()
    const container = createTestContainer()
    const onSuccess = vi.fn()
    render(<ClientForm onSubmit={container.useCases.registerClient} onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText('Nome completo'), 'Ana Machava')
    await user.type(screen.getByLabelText('Email'), 'ana@exemplo.co.mz')
    await user.type(screen.getByLabelText('Telemóvel'), '84 123 4567')
    await user.type(screen.getByLabelText('Endereço'), 'Av. Julius Nyerere, 1200')
    await user.click(screen.getByRole('button', { name: 'Registar cliente' }))

    expect(onSuccess).toHaveBeenCalledOnce()
    expect(await container.repositories.clients.findAll()).toHaveLength(1)
    expect(screen.getByLabelText('Nome completo')).toHaveValue('')
  })

  it('shows the duplicated email rule from the use case', async () => {
    const user = userEvent.setup()
    const container = createTestContainer()
    await container.useCases.registerClient({ name: 'Ana Machava', email: 'ana@exemplo.co.mz', phone: '841234567', address: 'Rua A, 123' })
    render(<ClientForm onSubmit={container.useCases.registerClient} />)

    await user.type(screen.getByLabelText('Nome completo'), 'Ana Outra')
    await user.type(screen.getByLabelText('Email'), 'ana@exemplo.co.mz')
    await user.type(screen.getByLabelText('Telemóvel'), '851234567')
    await user.type(screen.getByLabelText('Endereço'), 'Rua B, 456')
    await user.click(screen.getByRole('button', { name: 'Registar cliente' }))

    expect(await screen.findByText('Já existe um cliente com este email.')).toBeInTheDocument()
  })
})
