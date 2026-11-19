import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ContractSignatureForm } from './ContractSignatureForm'

describe('ContractSignatureForm', () => {
  it('requires reading the contract and the exact registered name', () => {
    const onSign = vi.fn()
    render(<ContractSignatureForm expectedName="Amélia João" busy={false} onSign={onSign} />)

    const button = screen.getByRole('button', { name: 'Confirmar e assinar' })
    const nameInput = screen.getByRole('textbox', { name: 'Nome completo para assinatura' })
    expect(button).toBeDisabled()

    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.change(nameInput, { target: { value: 'Amélia' } })
    expect(button).toBeDisabled()

    fireEvent.change(nameInput, { target: { value: 'Amélia João' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(onSign).toHaveBeenCalledWith('Amélia João', true)
  })
})
