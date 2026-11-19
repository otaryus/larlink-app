import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createTestContainer, seedActiveContract } from '../../../test/fixtures'
import { ReviewForm } from './ReviewForm'

async function setup({ paid = true } = {}) {
  const container = createTestContainer()
  const { contract } = await seedActiveContract(container)
  if (paid) await container.useCases.registerPayment({ contractId: contract.id, referenceMonth: '2026-10', method: 'MPESA', account: '841234567' })
  const onSuccess = vi.fn()
  const user = userEvent.setup()
  render(<ReviewForm contracts={[{ id: contract.id, label: 'Rosa Mabunda' }]} onSubmit={container.useCases.submitReview} onSuccess={onSuccess} />)
  await user.selectOptions(screen.getByLabelText('Contrato'), 'Rosa Mabunda')
  return { container, user, onSuccess }
}

describe('ReviewForm', () => {
  it('requires a rating', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: 'Enviar avaliação' }))
    expect(await screen.findByText('A nota deve ser entre 1 e 5.')).toBeInTheDocument()
  })

  it('requires a justification for low ratings', async () => {
    const { user } = await setup()
    await user.click(screen.getByRole('button', { name: '2 estrelas' }))
    await user.click(screen.getByRole('button', { name: 'Enviar avaliação' }))
    expect(await screen.findByText(/Para notas baixas, justifique/)).toBeInTheDocument()
  })

  it('blocks reviews before the service happened', async () => {
    const { user } = await setup({ paid: false })
    await user.click(screen.getByRole('button', { name: '5 estrelas' }))
    await user.click(screen.getByRole('button', { name: 'Enviar avaliação' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/primeiro pagamento/)
  })

  it('submits a review', async () => {
    const { user, container, onSuccess } = await setup()
    await user.click(screen.getByRole('button', { name: '5 estrelas' }))
    expect(screen.getByRole('button', { name: '5 estrelas' })).toHaveAttribute('aria-pressed', 'true')
    await user.type(screen.getByLabelText('Comentário'), 'Muito pontual.')
    await user.click(screen.getByRole('button', { name: 'Enviar avaliação' }))
    expect(onSuccess).toHaveBeenCalledOnce()
    expect((await container.repositories.reviews.findAll())[0]).toMatchObject({ rating: 5, comment: 'Muito pontual.' })
  })
})
