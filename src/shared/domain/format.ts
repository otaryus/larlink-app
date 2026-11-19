export function formatMZN(value: number): string {
  return `${value.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN`
}

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-')
  return `${Number(day)} ${MONTHS_PT[Number(month) - 1]} ${year}`
}

export function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  return `${MONTHS_PT[Number(m) - 1]} ${year}`
}
