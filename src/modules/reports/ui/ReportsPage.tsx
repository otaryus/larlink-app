import { formatMonth, formatMZN } from '../../../shared/domain/format'
import { useQuery } from '../../../shared/ui/ContainerContext'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { PersonCell } from '../../../shared/ui/PersonCell'
import { toCandidateCards } from '../../placement/ui/candidateCards'
import { monthlyReport } from '../domain/Stats'
import { StatsPanel } from './StatsPanel'

export function ReportsPage() {
  const data = useQuery(
    async (c) => {
      const { repositories } = c
      const [contracts, payments, housekeepers] = await Promise.all([
        repositories.contracts.findAll(),
        repositories.payments.findAll(),
        repositories.housekeepers.findAll(),
      ])
      const cards = await toCandidateCards(c, housekeepers.filter((h) => h.status === 'APPROVED'))
      const top = cards
        .filter((card) => card.reviewCount > 0)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount)
        .slice(0, 5)
      return { monthly: monthlyReport(contracts, payments), top }
    },
    { monthly: [], top: [] },
  )

  return (
    <>
      <PageHeader title="Relatórios" subtitle="Indicadores de desempenho da plataforma" />
      <div className="reports-layout">
        <StatsPanel />
        <section className="panel">
          <h2 className="section-title">Resumo mensal</h2>
          <table>
            <thead><tr><th>Mês</th><th>Contratos celebrados</th><th>Comissão recebida</th></tr></thead>
            <tbody>
              {data.monthly.map((m) => (
                <tr key={m.month}><td>{formatMonth(m.month)}</td><td>{m.contracts}</td><td>{formatMZN(m.commission)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="panel">
          <h2 className="section-title">Melhor avaliadas</h2>
          <ol className="ranking">
            {data.top.map((card) => (
              <li key={card.housekeeper.id}>
                <PersonCell id={card.housekeeper.id} name={card.housekeeper.name} detail={`${card.reviewCount} avaliações`} />
                <strong>★ {card.rating?.toFixed(1)}</strong>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  )
}
