import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createTestContainer, seedClientAndApprovedHousekeeper } from '../../../test/fixtures'
import { HireRequestForm } from './HireRequestForm'

async function setup() {
  const container = createTestContainer()
  const { client, housekeeper } = await seedClientAndApprovedHousekeeper(container)
  const onSuccess = vi.fn()
  const user = userEvent.setup()
  render(<HireRequestForm housekeeper={housekeeper} clients={[client]} onSubmit={container.useCases.submitHireRequest} onSuccess={onSuccess} />)
  return { container, user, onSuccess }
}

describe('HireRequestForm', () => {
  it("only offers the housekeeper's own skills and days", async () => {
    await setup()
    expect(screen.getByLabelText('Limpeza')).toBeInTheDocument()
    expect(screen.getByLabelText('Cozinha')).toBeInTheDocument()
    expect(screen.queryByLabelText('Jardinagem')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Domingo')).not.toBeInTheDocument()
  })

  it('validates client, services, days and start date', async () => {
    const { user } = await setup()
    await user.type(screen.getByLabelText('Data de início'), '2020-01-01')
    await user.click(screen.getByRole('button', { name: 'Enviar pedido' }))
    expect(await screen.findByText('Seleccione o cliente.')).toBeInTheDocument()
    expect(screen.getByText('Seleccione pelo menos um serviço.')).toBeInTheDocument()
    expect(screen.getByText('Seleccione pelo menos um dia.')).toBeInTheDocument()
    expect(screen.getByText('A data de início não pode estar no passado.')).toBeInTheDocument()
  })

  it('sends a valid request', async () => {
    const { user, container, onSuccess } = await setup()
    await user.selectOptions(screen.getByLabelText('Cliente'), 'Ana Machava')
    await user.type(screen.getByLabelText('Data de início'), '2026-11-02')
    await user.click(screen.getByLabelText('Limpeza'))
    await user.click(screen.getByLabelText('Segunda'))
    await user.click(screen.getByRole('button', { name: 'Enviar pedido' }))

    expect(onSuccess).toHaveBeenCalledOnce()
    expect((await container.repositories.hireRequests.findAll())[0]).toMatchObject({ status: 'PENDING', startDate: '2026-11-02' })
  })
})
