import { describe, expect, it } from 'vitest'
import { isIntegerBetween, isValidEmail, isValidFullName, isValidPhone, normalizePhone } from './validators'

describe('validators', () => {
  it.each(['841234567', '84 123 4567', '+258 84 123 4567', '258871234567', '82-123-4567'])(
    'accepts Mozambican mobile %s',
    (phone) => expect(isValidPhone(phone)).toBe(true),
  )

  it.each(['811234567', '881234567', '84123456', '2112345678', 'abc'])('rejects phone %s', (phone) =>
    expect(isValidPhone(phone)).toBe(false),
  )

  it('normalizes phone numbers', () => {
    expect(normalizePhone('+258 84-123 4567')).toBe('841234567')
  })

  it('validates email', () => {
    expect(isValidEmail('ana@exemplo.co.mz')).toBe(true)
    expect(isValidEmail('ana@exemplo')).toBe(false)
    expect(isValidEmail('ana exemplo.com')).toBe(false)
  })

  it('requires first and last name with letters only', () => {
    expect(isValidFullName('Ana Machava')).toBe(true)
    expect(isValidFullName("João D'Almeida")).toBe(true)
    expect(isValidFullName('Ana')).toBe(false)
    expect(isValidFullName('Ana 123')).toBe(false)
  })

  it('checks integer ranges', () => {
    expect(isIntegerBetween(3, 1, 5)).toBe(true)
    expect(isIntegerBetween(3.5, 1, 5)).toBe(false)
    expect(isIntegerBetween(6, 1, 5)).toBe(false)
  })
})
