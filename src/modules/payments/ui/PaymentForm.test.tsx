import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createTestContainer, seedActiveContract } from '../../../test/fixtures'
import { PaymentForm } from './PaymentForm'

async function setup() {
  const container = createTestContainer()
  const { contract } = await seedActiveContract(container)
  const onSuccess = vi.fn()
  const user = userEvent.setup()
  render(
    <PaymentForm
      contracts={[{ id: contract.id, label: 'Rosa Mabunda — Ana Machava', nextDueMonth: '2026-10', monthlyTotal: 7700 }]}
      onSubmit={container.useCases.registerPayment}
      onSuccess={onSuccess}
    />,
  )
  return { container, user, onSuccess }
}

describe('PaymentForm', () => {
  it('fills the next due month and shows the total computed by the domain', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Contrato'), 'Rosa Mabunda — Ana Machava')
    expect(screen.getByLabelText('Mês de referência')).toHaveValue('2026-10')
    expect(screen.getByText(/7.?700,00 MZN/)).toBeInTheDocument()
  })

  it('validates the account according to the method', async () => {
    const { user } = await setup()
    await user.selectOptions(screen.getByLabelText('Contrato'), 'Rosa Mabunda — Ana Machava')
    await user.selectOptions(screen.getByLabelText('Método'), 'M-Pesa')
    await user.type(screen.getByLabelText('Número de telemóvel'), '861234567')
    await user.click(screen.getByRole('button', { name: 'Registar pagamento' }))
    expect(await screen.findByText(/Número M-Pesa inválido/)).toBeInTheDocument()
  })

  it('asks for the NIB on bank transfers and registers the payment', async () => {
    const { user, container, onSuccess } = await setup()
    await user.selectOptions(screen.getByLabelText('Contrato'), 'Rosa Mabunda — Ana Machava')
    await user.selectOptions(screen.getByLabelText('Método'), 'Transferência bancária')
    await user.type(screen.getByLabelText('NIB'), '000100001234567890123')
    await user.click(screen.getByRole('button', { name: 'Registar pagamento' }))
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(await container.repositories.payments.findAll()).toHaveLength(1)
  })

  it('shows a business rule error when no contract is selected', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Registar pagamento' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Seleccione um contrato válido.')
  })
})
