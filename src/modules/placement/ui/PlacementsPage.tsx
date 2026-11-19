import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '../../../shared/domain/format'
import { useContainer, useQuery } from '../../../shared/ui/ContainerContext'
import { ErrorAlert } from '../../../shared/ui/fields'
import { Modal } from '../../../shared/ui/Modal'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { PersonCell } from '../../../shared/ui/PersonCell'
import { RejectionForm } from '../../../shared/ui/RejectionForm'
import { Tabs } from '../../../shared/ui/Tabs'
import { useAction } from '../../../shared/ui/useAction'
import { useLookups } from '../../../shared/ui/useLookups'
import { SKILLS } from '../../housekeepers/domain/Housekeeper'
import { recentPlacements, STAGE_LABELS, type PlacementStage } from '../domain/PlacementStatus'

type View = 'ALL' | PlacementStage

export function PlacementsPage() {
  const { container, refresh } = useContainer()
  const navigate = useNavigate()
  const lookups = useLookups()
  const action = useAction()
  const [view, setView] = useState<View>('ALL')
  const [rejecting, setRejecting] = useState<string | null>(null)
  const rows = useQuery(
    async ({ repositories }) => recentPlacements(await repositories.hireRequests.findAll(), await repositories.contracts.findAll()),
    [],
  )
  const count = (stage: PlacementStage) => rows.filter((r) => r.stage === stage).length
  const shown = view === 'ALL' ? rows : rows.filter((r) => r.stage === view)
  const { decideHireRequest } = container.useCases

  return (
    <>
      <PageHeader title="Agenciamentos" subtitle="Pedidos de contratação e respectiva validação" />
      <Tabs
        label="Fase do agenciamento"
        active={view}
        onChange={setView}
        items={[
          { key: 'ALL', label: 'Todos', count: rows.length },
          { key: 'NEW_REQUEST', label: 'Novos pedidos', count: count('NEW_REQUEST') },
          { key: 'IN_PROGRESS', label: 'Em processo', count: count('IN_PROGRESS') },
          { key: 'CONTRACT_SIGNED', label: 'Contrato assinado', count: count('CONTRACT_SIGNED') },
          { key: 'COMPLETED', label: 'Concluídos', count: count('COMPLETED') },
        ]}
      />
      <ErrorAlert message={action.error} />
      <div className="panel table-panel">
        {shown.length === 0 ? (
          <p className="empty">Sem agenciamentos nesta fase.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Candidata</th><th>Cliente</th><th>Serviços</th><th>Início</th><th>Fase</th><th aria-label="Acções" /></tr>
            </thead>
            <tbody>
              {shown.map(({ request: r, stage, updatedAt }) => (
                <tr key={r.id}>
                  <td><PersonCell id={r.housekeeperId} name={lookups.housekeeper.get(r.housekeeperId)?.name ?? '—'} detail={formatDate(updatedAt)} /></td>
                  <td>{lookups.client.get(r.clientId)?.name}</td>
                  <td>{r.requiredSkills.map((s) => SKILLS[s]).join(', ')}</td>
                  <td>{formatDate(r.startDate)}</td>
                  <td>
                    <span className="stage"><span className={`dot dot-${stage.toLowerCase()}`} />{STAGE_LABELS[stage]}</span>
                    {r.rejectionReason && <small className="muted block">{r.rejectionReason}</small>}
                  </td>
                  <td className="row-actions">
                    {stage === 'NEW_REQUEST' && (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={() => action.run(() => decideHireRequest({ hireRequestId: r.id, decision: 'APPROVE' }))}>Aprovar</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setRejecting(r.id)}>Rejeitar</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => action.run(() => decideHireRequest({ hireRequestId: r.id, decision: 'CANCEL' }))}>Cancelar</button>
                      </>
                    )}
                    {stage === 'IN_PROGRESS' && (
                      <button className="btn btn-soft btn-sm" onClick={() => navigate(`/contratos?pedido=${r.id}`)}>Celebrar contrato</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Modal title="Rejeitar pedido" open={rejecting !== null} onClose={() => setRejecting(null)}>
        <RejectionForm
          onCancel={() => setRejecting(null)}
          onConfirm={async (reason) => {
            await decideHireRequest({ hireRequestId: rejecting!, decision: 'REJECT', reason })
            setRejecting(null)
            refresh()
          }}
        />
      </Modal>
    </>
  )
}
