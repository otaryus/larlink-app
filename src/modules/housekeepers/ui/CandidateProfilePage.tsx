import { ArrowLeft, Calendar, FileText, MapPin, Phone, Star, UsersRound, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatDate, formatMZN } from '../../../shared/domain/format'
import { useContainer, useQuery } from '../../../shared/ui/ContainerContext'
import { SuccessAlert } from '../../../shared/ui/fields'
import { Portrait } from '../../../shared/ui/Portrait'
import { AVAILABILITY_LABELS } from '../../placement/domain/PlacementStatus'
import { toCandidateCards } from '../../placement/ui/candidateCards'
import { HireRequestForm } from '../../placement/ui/HireRequestForm'
import { SKILLS, WEEKDAYS } from '../domain/Housekeeper'

export function CandidateProfilePage() {
  const { id = '' } = useParams()
  const { container, refresh } = useContainer()
  const [sent, setSent] = useState(false)
  const data = useQuery(
    async (c) => {
      const housekeeper = await c.repositories.housekeepers.findById(id)
      if (!housekeeper) return null
      const [card] = await toCandidateCards(c, [housekeeper])
      const reviews = (await c.repositories.reviews.findAll())
        .filter((r) => r.housekeeperId === id && r.comment)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5)
      return { card, reviews, clients: await c.repositories.clients.findAll() }
    },
    undefined,
    [id],
  )

  if (data === undefined) return <p className="empty">A carregar…</p>
  if (data === null) return <p className="empty">Candidata não encontrada. <Link to="/candidatas">Voltar</Link></p>

  const { housekeeper: h, rating, reviewCount, availability } = data.card
  const canRequest = h.status === 'APPROVED' && availability !== 'HIRED'

  return (
    <>
      <Link to="/" className="back-link"><ArrowLeft size={18} /> Voltar</Link>
      <div className="profile-layout">
        <section className="panel profile-card">
          <div className="profile-hero">
            <Portrait seed={h.id} className="profile-photo" label={`Foto de ${h.name}`} />
            <div>
              <span className={`status-pill static status-${availability.toLowerCase()}`}>{AVAILABILITY_LABELS[availability]}</span>
              <h1>{h.name}</h1>
              <p className="rating">
                <Star size={18} className="star-icon" />
                <strong>{rating?.toFixed(1) ?? '—'}</strong>
                <span className="muted">({reviewCount} avaliações)</span>
              </p>
              <div className="chips">{h.skills.map((s) => <span key={s} className="chip">{SKILLS[s]}</span>)}</div>
            </div>
          </div>
          <ul className="profile-facts">
            <li><UsersRound size={18} />{h.yearsOfExperience} anos de experiência</li>
            <li><MapPin size={18} />{h.city} • {h.neighborhood}</li>
            <li><Phone size={18} />{h.phone}</li>
            <li><Wallet size={18} />{formatMZN(h.expectedSalary)} / mês</li>
            <li><Calendar size={18} />{h.availability.map((d) => WEEKDAYS[d]).join(', ')}</li>
            <li><FileText size={18} />{h.status === 'APPROVED' ? 'Documentação verificada' : 'Documentação em validação'}</li>
          </ul>
          <h2 className="section-title">Comentários recentes</h2>
          {data.reviews.length === 0 ? (
            <p className="empty">Sem comentários escritos.</p>
          ) : (
            <ul className="review-list">
              {data.reviews.map((r) => (
                <li key={r.id}>
                  <span className="stars-static">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <p>{r.comment}</p>
                  <small className="muted">{formatDate(r.createdAt)}</small>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2 className="section-title">Solicitar agenciamento</h2>
          <SuccessAlert message={sent ? 'Pedido enviado. O gestor irá validá-lo.' : null} />
          {canRequest ? (
            <HireRequestForm
              housekeeper={h}
              clients={data.clients}
              onSubmit={container.useCases.submitHireRequest}
              onSuccess={() => {
                setSent(true)
                refresh()
              }}
            />
          ) : (
            <p className="empty">Esta candidata não está disponível para novos pedidos.</p>
          )}
        </section>
      </div>
    </>
  )
}
