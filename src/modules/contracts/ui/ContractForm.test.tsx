import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createTestContainer, seedClientAndApprovedHousekeeper, TODAY } from '../../../test/fixtures'
import { ContractForm } from './ContractForm'

async function setup() {
  const container = createTestContainer()
  const { client, housekeeper } = await seedClientAndApprovedHousekeeper(container)
  const request = await container.useCases.submitHireRequest({ clientId: client.id, housekeeperId: housekeeper.id, requiredSkills: ['CLEANING'], requiredDays: ['MON'], startDate: TODAY, notes: '' })
  await container.useCases.decideHireRequest({ hireRequestId: request.id, decision: 'APPROVE' })
  const onSuccess = vi.fn()
  const user = userEvent.setup()
  render(
    <ContractForm
      defaultRequestId={request.id}
      approvedRequests={[{ id: request.id, label: 'Rosa Mabunda — Ana Machava' }]}
      onSubmit={container.useCases.signContract}
      onSuccess={onSuccess}
    />,
  )
  return { container, user, onSuccess }
}

describe('ContractForm', () => {
  it('preselects the request coming from the placements page', async () => {
    await setup()
    expect(screen.getByLabelText('Pedido aprovado')).toHaveValue(screen.getByRole('option', { name: 'Rosa Mabunda — Ana Machava' }).getAttribute('value'))
  })

  it('salary cannot be below the expected salary; duration within 1–24 months', async () => {
    const { user } = await setup()
    await user.type(screen.getByLabelText('Salário mensal (MZN)'), '6000')
    await user.type(screen.getByLabelText('Duração (meses)'), '30')
    await user.click(screen.getByRole('button', { name: 'Celebrar contrato' }))
    expect(await screen.findByText(/inferior ao pretendido pela empregada/)).toBeInTheDocument()
    expect(screen.getByText('A duração deve ser entre 1 e 24 meses.')).toBeInTheDocument()
  })

  it('signs a valid contract', async () => {
    const { user, container, onSuccess } = await setup()
    await user.type(screen.getByLabelText('Salário mensal (MZN)'), '7500')
    await user.type(screen.getByLabelText('Duração (meses)'), '6')
    await user.click(screen.getByRole('button', { name: 'Celebrar contrato' }))
    expect(onSuccess).toHaveBeenCalledOnce()
    expect((await container.repositories.contracts.findAll())[0]).toMatchObject({ monthlySalary: 7500, status: 'ACTIVE' })
  })
})
