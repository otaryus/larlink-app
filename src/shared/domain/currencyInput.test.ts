import { describe, expect, it } from 'vitest'
import { formatCurrencyInput, parseCurrencyInput } from './currencyInput'

describe('currency input formatting', () => {
  it('shows zero with two decimal places when the value is empty', () => {
    expect(formatCurrencyInput('')).toBe('0,00')
  })

  it('formats meticais with grouped thousands and decimal comma', () => {
    expect(formatCurrencyInput('12500.5')).toMatch(/^12.?500,50$/)
  })

  it('parses Portuguese decimal and grouped values', () => {
    expect(parseCurrencyInput('12 500,50')).toBe('12500.5')
    expect(parseCurrencyInput('12500.50')).toBe('12500.5')
  })

  it('returns zero for an empty or invalid value', () => {
    expect(parseCurrencyInput('')).toBe('0')
    expect(parseCurrencyInput('abc')).toBe('0')
  })
})
