import { Plus, Star } from 'lucide-react'
import { useState } from 'react'
import { formatDate } from '../../../shared/domain/format'
import { useContainer, useQuery } from '../../../shared/ui/ContainerContext'
import { Modal } from '../../../shared/ui/Modal'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { PersonCell } from '../../../shared/ui/PersonCell'
import { useLookups } from '../../../shared/ui/useLookups'
import { averageRating } from '../domain/Review'
import { ReviewForm } from './ReviewForm'

export function ReviewsPage() {
  const { container, refresh } = useContainer()
  const [creating, setCreating] = useState(false)
  const lookups = useLookups()
  const data = useQuery(
    async ({ repositories }) => ({
      contracts: await repositories.contracts.findAll(),
      reviews: await repositories.reviews.findAll(),
    }),
    { contracts: [], reviews: [] },
  )
  const reviewed = new Set(data.reviews.map((r) => r.contractId))
  const average = averageRating(data.reviews)
  const distribution = [5, 4, 3, 2, 1].map((n) => ({ n, count: data.reviews.filter((r) => r.rating === n).length }))
  const latest = [...data.reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12)

  return (
    <>
      <PageHeader
        title="Avaliações"
        subtitle="Satisfação dos clientes com o serviço prestado"
        action={<button className="btn btn-primary" onClick={() => setCreating(true)}><Plus size={18} /> Nova avaliação</button>}
      />
      <div className="reviews-layout">
        <section className="panel rating-summary">
          <strong className="big-rating">{average?.toFixed(1) ?? '—'}</strong>
          <span className="stars-static">★★★★★</span>
          <span className="muted">{data.reviews.length} avaliações</span>
          <ul className="distribution">
            {distribution.map(({ n, count }) => (
              <li key={n}>
                <span>{n} <Star size={12} /></span>
                <span className="bar"><span style={{ width: `${data.reviews.length ? (count / data.reviews.length) * 100 : 0}%` }} /></span>
                <span className="muted">{count}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <h2 className="section-title">Mais recentes</h2>
          <ul className="review-feed">
            {latest.map((r) => (
              <li key={r.id}>
                <PersonCell id={r.housekeeperId} name={lookups.housekeeper.get(r.housekeeperId)?.name ?? '—'} detail={`por ${lookups.client.get(r.clientId)?.name ?? '—'}`} />
                <span className="stars-static">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                <time className="muted">{formatDate(r.createdAt)}</time>
                {r.comment && <p>{r.comment}</p>}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <Modal title="Nova avaliação" open={creating} onClose={() => setCreating(false)}>
        <ReviewForm
          contracts={data.contracts
            .filter((c) => !reviewed.has(c.id))
            .map((c) => ({ id: c.id, label: `${lookups.housekeeper.get(c.housekeeperId)?.name ?? '—'} — ${lookups.client.get(c.clientId)?.name ?? ''}` }))}
          onSubmit={container.useCases.submitReview}
          onSuccess={() => {
            setCreating(false)
            refresh()
          }}
        />
      </Modal>
    </>
  )
}
