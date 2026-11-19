const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

function toDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`)
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function isValidDate(value: string): boolean {
  return DATE_REGEX.test(value) && toISODate(toDate(value)) === value
}

export function isValidMonth(value: string): boolean {
  return MONTH_REGEX.test(value)
}

export function ageAt(birthDate: string, now: Date): number {
  const birth = toDate(birthDate)
  let age = now.getUTCFullYear() - birth.getUTCFullYear()
  const months = now.getUTCMonth() - birth.getUTCMonth()
  if (months < 0 || (months === 0 && now.getUTCDate() < birth.getUTCDate())) age--
  return age
}

export function addMonths(isoDate: string, months: number): string {
  const date = toDate(isoDate)
  date.setUTCMonth(date.getUTCMonth() + months)
  return toISODate(date)
}

export function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7)
}

export function nextMonth(month: string): string {
  return monthOf(addMonths(`${month}-01`, 1))
}
