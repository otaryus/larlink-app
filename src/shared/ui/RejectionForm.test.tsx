import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createTestContainer, housekeeperData } from '../../test/fixtures'
import { RejectionForm } from './RejectionForm'

describe('RejectionForm', () => {
  it('requires a reason with at least 10 characters (domain rule)', async () => {
    const user = userEvent.setup()
    const container = createTestContainer()
    const h = await container.useCases.registerHousekeeper(housekeeperData())
    render(<RejectionForm onCancel={vi.fn()} onConfirm={(reason) => container.useCases.reviewProfile({ housekeeperId: h.id, decision: 'REJECT', reason })} />)

    await user.type(screen.getByLabelText('Motivo da rejeição'), 'curto')
    await user.click(screen.getByRole('button', { name: 'Confirmar rejeição' }))
    expect(await screen.findByText(/mín\. 10 caracteres/)).toBeInTheDocument()

    await user.type(screen.getByLabelText('Motivo da rejeição'), ' demais, documentos ilegíveis')
    await user.click(screen.getByRole('button', { name: 'Confirmar rejeição' }))
    expect((await container.repositories.housekeepers.findById(h.id))?.status).toBe('REJECTED')
  })

  it('cancels', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<RejectionForm onCancel={onCancel} onConfirm={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
