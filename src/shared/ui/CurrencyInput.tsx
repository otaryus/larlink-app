import { useEffect, useRef, useState, type FocusEvent, type InputHTMLAttributes } from 'react'
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
  const inputRef = useRef<HTMLInputElement>(null)

  function setAmountValidity(input: HTMLInputElement, amountText: string) {
    const amount = Number(parseCurrencyInput(amountText))
    const min = props.min === undefined ? undefined : Number(props.min)
    const max = props.max === undefined ? undefined : Number(props.max)
    const step = props.step === undefined || props.step === 'any' ? undefined : Number(props.step)

    let message = ''
    if (!Number.isFinite(amount)) message = 'Indique um valor numérico válido.'
    else if (min !== undefined && amount < min) message = `O valor deve ser igual ou superior a ${min}.`
    else if (max !== undefined && amount > max) message = `O valor deve ser igual ou inferior a ${max}.`
    else if (step && Number.isFinite(step)) {
      const base = min ?? 0
      const steps = (amount - base) / step
      if (Math.abs(steps - Math.round(steps)) > 1e-8)
        message = `Indique um valor em incrementos de ${step}.`
    }

    input.setCustomValidity(message)
  }

  useEffect(() => {
    const input = inputRef.current
    if (input) setAmountValidity(input, focused ? draft || editableValue(value) : editableValue(value))
  }, [draft, focused, props.max, props.min, props.step, value])

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    setFocused(true)
    const next = editableValue(value)
    setDraft(next)
    setAmountValidity(event.currentTarget, next)
    event.currentTarget.select()
    onFocus?.(event)
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    const parsed = parseCurrencyInput(draft || '0')
    setAmountValidity(event.currentTarget, parsed)
    onChange(parsed)
    setDraft(formatCurrencyInput(parsed))
    setFocused(false)
    onBlur?.(event)
  }

  return (
    <input
      {...props}
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={focused ? draft || '0,00' : formatCurrencyInput(value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={(event) => {
        const next = currencyDraft(event.target.value)
        setDraft(next)
        setAmountValidity(event.currentTarget, next)
        onChange(parseCurrencyInput(next))
      }}
    />
  )
}
