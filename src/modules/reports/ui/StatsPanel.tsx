import { CircleCheck, Star, UsersRound, Users, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '../../../shared/ui/ContainerContext'
import { PERIODS, type Period } from '../domain/Stats'

interface Tile {
  icon: LucideIcon
  tone: 'blue' | 'green' | 'orange' | 'yellow'
  value: string
  label: string
}

export function StatsPanel() {
  const [period, setPeriod] = useState<Period>('MONTH')
  const stats = useQuery((c) => c.useCases.getDashboard(period), null, [period])

  const tiles: Tile[] = stats
    ? [
        { icon: Users, tone: 'blue', value: String(stats.housekeepers), label: 'Candidatas cadastradas' },
        { icon: CircleCheck, tone: 'green', value: String(stats.placements), label: 'Agenciamentos realizados' },
        { icon: UsersRound, tone: 'orange', value: String(stats.clients), label: 'Clientes activos' },
        { icon: Star, tone: 'yellow', value: stats.averageRating?.toFixed(1) ?? '—', label: 'Avaliação média' },
      ]
    : []

  return (
    <section className="panel" aria-labelledby="stats-title">
      <header className="panel-header">
        <h2 id="stats-title">Estatísticas</h2>
        <select aria-label="Período" className="pill-select" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
          {Object.entries(PERIODS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </header>
      <div className="stat-grid">
        {tiles.map(({ icon: Icon, tone, value, label }) => (
          <div key={label} className="stat-tile">
            <span className={`stat-icon tone-${tone}`}><Icon size={22} strokeWidth={2} /></span>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
