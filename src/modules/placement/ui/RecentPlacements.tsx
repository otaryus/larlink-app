import { Link } from 'react-router-dom'
import { formatDate } from '../../../shared/domain/format'
import { useQuery } from '../../../shared/ui/ContainerContext'
import { Portrait } from '../../../shared/ui/Portrait'
import { recentPlacements, STAGE_LABELS } from '../domain/PlacementStatus'

export function RecentPlacements({ limit = 4 }: { limit?: number }) {
  const rows = useQuery(
    async ({ repositories }) => {
      const [requests, contracts, housekeepers] = await Promise.all([
        repositories.hireRequests.findAll(),
        repositories.contracts.findAll(),
        repositories.housekeepers.findAll(),
      ])
      const names = new Map(housekeepers.map((h) => [h.id, h.name]))
      return recentPlacements(requests, contracts)
        .slice(0, limit)
        .map((p) => ({ ...p, name: names.get(p.request.housekeeperId) ?? '—' }))
    },
    [],
  )

  return (
    <section className="panel" aria-labelledby="recent-title">
      <header className="panel-header">
        <h2 id="recent-title">Agenciamentos recentes</h2>
        <Link to="/agenciamentos" className="link">Ver todos</Link>
      </header>
      <ul className="recent-list">
        {rows.map((row) => (
          <li key={row.request.id}>
            <Portrait seed={row.request.housekeeperId} className="avatar avatar-md" />
            <div className="recent-text">
              <strong>{row.name}</strong>
              <span>{STAGE_LABELS[row.stage]}</span>
            </div>
            <div className="recent-meta">
              <span className={`dot dot-${row.stage.toLowerCase()}`} aria-hidden="true" />
              <time dateTime={row.updatedAt}>{formatDate(row.updatedAt)}</time>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
