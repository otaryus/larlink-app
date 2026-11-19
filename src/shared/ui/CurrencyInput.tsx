import { useState, type FocusEvent, type InputHTMLAttributes } from 'react'
import { formatCurrencyInput, parseCurrencyInput } from '../domain/currencyInput'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: string | number
  onChange: (value: string) => void
}

function editableValue(value: string | number): string {
  const amount = Number(parseCurrencyInput(String(value)))
  return Number.isFinite(amount) ? amount.toFixed(2).replace('.', ',') : '0,00'
}

function currencyDraft(value: string): string {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(/\./g, ',')
  const negative = cleaned.startsWith('-')
  const unsigned = cleaned.replace(/-/g, '')
  const separator = unsigned.lastIndexOf(',')
  const integer = (separator < 0 ? unsigned : unsigned.slice(0, separator)).replace(/,/g, '')
  const fraction = separator < 0 ? '' : `,${unsigned.slice(separator + 1).replace(/,/g, '').slice(0, 2)}`
  return `${negative ? '-' : ''}${integer}${fraction}` || '0,00'
}

export function CurrencyInput({ value, onChange, onFocus, onBlur, ...props }: Props) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    setFocused(true)
    setDraft(editableValue(value))
    event.currentTarget.select()
    onFocus?.(event)
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    const parsed = parseCurrencyInput(draft || '0')
    onChange(parsed)
    setDraft(formatCurrencyInput(parsed))
    setFocused(false)
    onBlur?.(event)
  }

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      value={focused ? draft || '0,00' : formatCurrencyInput(value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={(event) => {
        const next = currencyDraft(event.target.value)
        setDraft(next)
        onChange(parseCurrencyInput(next))
      }}
    />
  )
}
