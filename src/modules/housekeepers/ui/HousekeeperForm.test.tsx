import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createTestContainer } from '../../../test/fixtures'
import { HousekeeperForm } from './HousekeeperForm'

describe('HousekeeperForm', () => {
  it('shows errors for every required rule', async () => {
    const user = userEvent.setup()
    render(<HousekeeperForm onSubmit={createTestContainer().useCases.registerHousekeeper} />)

    await user.click(screen.getByRole('button', { name: 'Submeter perfil' }))

    expect(await screen.findByText('Data de nascimento inválida.')).toBeInTheDocument()
    expect(screen.getByText('Seleccione a cidade.')).toBeInTheDocument()
    expect(screen.getByText('Seleccione pelo menos uma competência.')).toBeInTheDocument()
    expect(screen.getByText('Seleccione pelo menos um dia disponível.')).toBeInTheDocument()
    expect(screen.getByText(/salário pretendido não pode ser inferior/)).toBeInTheDocument()
  })

  it('rejects an underage candidate', async () => {
    const user = userEvent.setup()
    render(<HousekeeperForm onSubmit={createTestContainer().useCases.registerHousekeeper} />)
    await user.type(screen.getByLabelText('Data de nascimento'), '2015-01-01')
    await user.click(screen.getByRole('button', { name: 'Submeter perfil' }))
    expect(await screen.findByText(/pelo menos 18 anos/)).toBeInTheDocument()
  })

  it('submits a complete profile as PENDING', async () => {
    const user = userEvent.setup()
    const container = createTestContainer()
    const onSuccess = vi.fn()
    render(<HousekeeperForm onSubmit={container.useCases.registerHousekeeper} onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText('Nome completo'), 'Rosa Mabunda')
    await user.type(screen.getByLabelText('Data de nascimento'), '1990-05-10')
    await user.type(screen.getByLabelText('Telemóvel'), '861112233')
    await user.selectOptions(screen.getByLabelText('Cidade'), 'Maputo')
    await user.type(screen.getByLabelText('Bairro'), 'Polana Caniço')
    await user.type(screen.getByLabelText('Salário pretendido (MZN)'), '7000')
    await user.type(screen.getByLabelText('Anos de experiência'), '5')
    await user.click(screen.getByLabelText('Limpeza'))
    await user.click(screen.getByLabelText('Segunda'))
    await user.click(screen.getByRole('button', { name: 'Submeter perfil' }))

    expect(onSuccess).toHaveBeenCalledOnce()
    const [saved] = await container.repositories.housekeepers.findAll()
    expect(saved).toMatchObject({ name: 'Rosa Mabunda', city: 'Maputo', skills: ['CLEANING'], availability: ['MON'], status: 'PENDING' })
  })
})
