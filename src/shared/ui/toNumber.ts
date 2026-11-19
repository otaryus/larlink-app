export function toNumber(value: string): number {
  return value.trim() === '' ? Number.NaN : Number(value.replace(',', '.'))
}
