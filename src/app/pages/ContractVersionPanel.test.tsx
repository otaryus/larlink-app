import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ContractVersionPanel } from './ContractVersionPanel'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))
vi.mock('../../shared/api/client', () => ({
  api: apiMock,
  json: (value: unknown) => ({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) }),
}))

const original = { id:'rev-1', version:1, kind:'CONTRATO', content:'Minuta original completa para revisão.', reason:'Minuta inicial', createdAt:'2026-11-18T10:00:00Z', createdBy:'Sistema' }
const amended = { id:'rev-2', version:2, kind:'ADENDA', content:'Minuta atualizada com uma alteração acordada.', reason:'Alteração de horário aprovada', createdAt:'2026-11-18T11:00:00Z', createdBy:'Gestor' }

describe('ContractVersionPanel', () => {
  beforeEach(() => apiMock.mockReset())

  it('shows version history to a contract party without revision controls', async () => {
    apiMock.mockResolvedValue([original])
    render(<ContractVersionPanel contractId="contract-1" currentContent={original.content} />)

    await userEvent.setup().click(await screen.findByText('Histórico e versões (1)'))
    expect(await screen.findByText('Versão 1 · CONTRATO')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name:'Nova revisão ou adenda' })).not.toBeInTheDocument()
    await userEvent.setup().click(screen.getByText('Ver conteúdo desta versão'))
    expect(await screen.findByText(original.content)).toBeInTheDocument()
  })

  it('lets the agency create a version and refreshes the history', async () => {
    apiMock.mockResolvedValueOnce([original]).mockResolvedValueOnce(amended).mockResolvedValueOnce([amended,original])
    const user = userEvent.setup()
    render(<ContractVersionPanel contractId="contract-1" currentContent={original.content} canEdit />)

    const panel = screen.getByText('Histórico e versões (0)')
    await user.click(panel)
    const content = await screen.findByLabelText('Texto completo')
    await user.clear(content)
    await user.type(content, amended.content)
    await user.type(screen.getByLabelText('Motivo da alteração'), amended.reason)
    await user.click(screen.getByRole('button', { name:'Guardar nova versão' }))

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith('/api/agent/contracts/contract-1/versions', expect.objectContaining({ method:'POST' })))
    expect(await screen.findByText('Versão 2 · ADENDA')).toBeInTheDocument()
    expect(within(screen.getByText('Versão 2 · ADENDA').closest('article')!).getByText(amended.reason)).toBeInTheDocument()
  })
})
