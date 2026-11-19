export function parseCurrencyInput(value: string): string {
  const compact = value.replace(/[\s\u00a0\u202f]/g, '')
  if (!compact || compact === '-') return '0'
  const normalized = compact.includes(',')
    ? compact.replace(/\./g, '').replace(',', '.')
    : compact
  const amount = Number(normalized)
  return Number.isFinite(amount) ? String(amount) : '0'
}

export function formatCurrencyInput(value: string | number): string {
  const amount = typeof value === 'number' ? value : Number(parseCurrencyInput(value))
  if (!Number.isFinite(amount)) return '0,00'
  return amount.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
