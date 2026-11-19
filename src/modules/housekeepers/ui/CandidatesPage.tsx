import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { formatDate, formatMZN } from '../../../shared/domain/format'
import { byNewest } from '../../../shared/domain/sorting'
import { useContainer, useQuery } from '../../../shared/ui/ContainerContext'
import { ErrorAlert, StatusBadge } from '../../../shared/ui/fields'
import { Modal } from '../../../shared/ui/Modal'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { PersonCell } from '../../../shared/ui/PersonCell'
import { RejectionForm } from '../../../shared/ui/RejectionForm'
import { Tabs } from '../../../shared/ui/Tabs'
import { useAction } from '../../../shared/ui/useAction'
import { useFavorites } from '../../../shared/ui/useFavorites'
import { normalizeText } from '../../placement/domain/Search'
import { CandidateCard } from '../../placement/ui/CandidateCard'
import { toCandidateCards } from '../../placement/ui/candidateCards'
import { SKILLS, type ProfileStatus } from '../domain/Housekeeper'
import { HousekeeperForm } from './HousekeeperForm'

type View = 'APPROVED' | 'PENDING' | 'REJECTED'
const PAGE_SIZE = 9

export function CandidatesPage() {
  const { container, refresh } = useContainer()
  const [params] = useSearchParams()
  const query = params.get('q') ?? ''
  const [view, setView] = useState<View>(params.get('estado') === 'pendentes' ? 'PENDING' : 'APPROVED')
  const [creating, setCreating] = useState(false)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const favorites = useFavorites()
  const action = useAction()

  const all = useQuery(async (c) => toCandidateCards(c, await c.repositories.housekeepers.findAll()), [])
  const matching = all
    .filter((c) => !query || normalizeText(c.housekeeper.name).includes(normalizeText(query)))
    .sort((a, b) => byNewest(a.housekeeper, b.housekeeper))
  const byStatus = (s: ProfileStatus) => matching.filter((c) => c.housekeeper.status === s)
  const approved = byStatus('APPROVED')
  const { reviewProfile } = container.useCases

  return (
    <>
      <PageHeader
        title="Candidatas"
        subtitle={query ? `Resultados para “${query}”` : 'Perfis registados e validação pelo gestor'}
        action={
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <Plus size={18} /> Nova candidata
          </button>
        }
      />
      <Tabs
        label="Estado do perfil"
        active={view}
        onChange={setView}
        items={[
          { key: 'APPROVED', label: 'Aprovadas', count: approved.length },
          { key: 'PENDING', label: 'Por validar', count: byStatus('PENDING').length },
          { key: 'REJECTED', label: 'Rejeitadas', count: byStatus('REJECTED').length },
        ]}
      />
      <ErrorAlert message={action.error} />

      {view === 'APPROVED' && (
        <>
          <div className="card-grid">
            {approved.slice(0, visible).map((card) => (
              <CandidateCard
                key={card.housekeeper.id}
                card={card}
                favorite={favorites.isFavorite(card.housekeeper.id)}
                onToggleFavorite={() => favorites.toggle(card.housekeeper.id)}
              />
            ))}
          </div>
          {visible < approved.length && (
            <button className="btn btn-soft load-more" onClick={() => setVisible(visible + PAGE_SIZE)}>
              Ver mais candidatas
            </button>
          )}
        </>
      )}

      {view !== 'APPROVED' && (
        <div className="panel table-panel">
          {byStatus(view).length === 0 ? (
            <p className="empty">Nenhum perfil nesta lista.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Candidata</th><th>Competências</th><th>Salário pretendido</th><th>Registo</th><th>Estado</th>
                  {view === 'PENDING' && <th aria-label="Acções" />}
                </tr>
              </thead>
              <tbody>
                {byStatus(view).map(({ housekeeper: h }) => (
                  <tr key={h.id}>
                    <td><PersonCell id={h.id} name={h.name} detail={`${h.city} • ${h.neighborhood}`} /></td>
                    <td>{h.skills.map((s) => SKILLS[s]).join(', ')}</td>
                    <td>{formatMZN(h.expectedSalary)}</td>
                    <td>{formatDate(h.createdAt)}</td>
                    <td>
                      <StatusBadge status={h.status} />
                      {h.rejectionReason && <small className="muted block">{h.rejectionReason}</small>}
                    </td>
                    {view === 'PENDING' && (
                      <td className="row-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => action.run(() => reviewProfile({ housekeeperId: h.id, decision: 'APPROVE' }))}>
                          Aprovar
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setRejecting(h.id)}>Rejeitar</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal title="Nova candidata" open={creating} onClose={() => setCreating(false)}>
        <HousekeeperForm
          onSubmit={container.useCases.registerHousekeeper}
          onSuccess={() => {
            setCreating(false)
            setView('PENDING')
            refresh()
          }}
        />
      </Modal>
      <Modal title="Rejeitar perfil" open={rejecting !== null} onClose={() => setRejecting(null)}>
        <RejectionForm
          onCancel={() => setRejecting(null)}
          onConfirm={async (reason) => {
            await reviewProfile({ housekeeperId: rejecting!, decision: 'REJECT', reason })
            setRejecting(null)
            refresh()
          }}
        />
      </Modal>
    </>
  )
}
