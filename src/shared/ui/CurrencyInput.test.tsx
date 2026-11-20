import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CurrencyInput } from './CurrencyInput'
import { useState } from 'react'

function ControlledCurrencyInput() {
  const [value, setValue] = useState('')
  return <CurrencyInput aria-label="Valor" value={value} onChange={setValue} />
}

describe('CurrencyInput', () => {
  it('never displays an empty amount', () => {
    render(<ControlledCurrencyInput />)

    expect(screen.getByRole('textbox', { name: 'Valor' })).toHaveValue('0,00')
  })

  it('accepts a decimal comma and formats the value after editing', () => {
    const onChange = vi.fn()
    function Wrapper() {
      const [value, setValue] = useState('')
      return <CurrencyInput aria-label="Valor" value={value} onChange={(next) => { onChange(next); setValue(next) }} />
    }
    render(<Wrapper />)
    const input = screen.getByRole('textbox', { name: 'Valor' })

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '12500,50' } })
    expect(onChange).toHaveBeenLastCalledWith('12500.5')
    fireEvent.blur(input)

    expect(input).toHaveValue('12 500,50')
  })

  it('restores zero when the value is cleared', () => {
    const onChange = vi.fn()
    function Wrapper() {
      const [value, setValue] = useState('10')
      return <CurrencyInput aria-label="Valor" value={value} onChange={(next) => { onChange(next); setValue(next) }} />
    }
    render(<Wrapper />)
    const input = screen.getByRole('textbox', { name: 'Valor' })

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '' } })

    expect(onChange).toHaveBeenLastCalledWith('0')
    expect(input).toHaveValue('0,00')
  })

  it('enforces minimum and step constraints before form submission', () => {
    function Wrapper() {
      const [value, setValue] = useState('5000')
      return <CurrencyInput aria-label="Salário" min="5000" step="50" value={value} onChange={setValue} />
    }
    render(<Wrapper />)
    const input = screen.getByRole('textbox', { name: 'Salário' })

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '5001' } })
    expect(input).toBeInvalid()

    fireEvent.change(input, { target: { value: '5050' } })
    expect(input).toBeValid()
  })
})
