import { ArrowRight, CircleCheck, Clock, FileText, Heart, MapPin, Star, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Portrait } from '../../../shared/ui/Portrait'
import { SKILLS } from '../../housekeepers/domain/Housekeeper'
import { AVAILABILITY_LABELS } from '../domain/PlacementStatus'
import type { CandidateCardData } from './candidateCards'

interface Props {
  card: CandidateCardData
  favorite: boolean
  onToggleFavorite: () => void
}

export function CandidateCard({ card, favorite, onToggleFavorite }: Props) {
  const { housekeeper: h, rating, reviewCount, availability } = card
  const StatusIcon = availability === 'AVAILABLE' ? CircleCheck : Clock

  return (
    <article className="candidate-card" aria-label={h.name}>
      <div className="candidate-photo">
        <Portrait seed={h.id} />
        <span className={`status-pill status-${availability.toLowerCase()}`}>
          <StatusIcon size={14} strokeWidth={2.4} />
          {AVAILABILITY_LABELS[availability]}
        </span>
        <button
          className={favorite ? 'fav-btn on' : 'fav-btn'}
          aria-label={favorite ? `Remover ${h.name} dos favoritos` : `Adicionar ${h.name} aos favoritos`}
          aria-pressed={favorite}
          onClick={onToggleFavorite}
        >
          <Heart size={18} />
        </button>
      </div>
      <div className="candidate-body">
        <h3>{h.name}</h3>
        <p className="rating">
          <Star size={16} className="star-icon" />
          {rating === null ? (
            <span className="muted">Sem avaliações</span>
          ) : (
            <>
              <strong>{rating.toFixed(1)}</strong>
              <span className="muted">({reviewCount} avaliações)</span>
            </>
          )}
        </p>
        <ul className="meta">
          <li><UsersRound size={16} />{h.yearsOfExperience} anos de experiência</li>
          <li><MapPin size={16} />{h.city}</li>
          <li><FileText size={16} />Documentação verificada</li>
        </ul>
        <div className="chips">
          {h.skills.map((s) => (
            <span key={s} className="chip">{SKILLS[s]}</span>
          ))}
        </div>
        <Link to={`/candidatas/${h.id}`} className="btn btn-primary btn-block">
          Ver perfil <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  )
}
