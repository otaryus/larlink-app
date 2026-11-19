const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const NAME_REGEX = /^[\p{L}' -]+$/u

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, '').replace(/^\+?258/, '')
}

export function isValidPhone(phone: string): boolean {
  return /^8[2-7]\d{7}$/.test(normalizePhone(phone))
}

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim())
}

export function isValidFullName(name: string): boolean {
  const trimmed = name.trim()
  return NAME_REGEX.test(trimmed) && trimmed.split(/\s+/).filter((p) => p.length >= 2).length >= 2
}

export function isIntegerBetween(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max
}
