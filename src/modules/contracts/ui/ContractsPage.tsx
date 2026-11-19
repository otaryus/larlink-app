import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { formatDate, formatMZN } from '../../../shared/domain/format'
import { useContainer, useQuery } from '../../../shared/ui/ContainerContext'
import { ErrorAlert, StatusBadge } from '../../../shared/ui/fields'
import { Modal } from '../../../shared/ui/Modal'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { PersonCell } from '../../../shared/ui/PersonCell'
import { useAction } from '../../../shared/ui/useAction'
import { useLookups } from '../../../shared/ui/useLookups'
import { commissionOf } from '../domain/Contract'
import { ContractForm } from './ContractForm'

export function ContractsPage() {
  const { container, refresh } = useContainer()
  const [params, setParams] = useSearchParams()
  const preselected = params.get('pedido') ?? ''
  const [creating, setCreating] = useState(preselected !== '')
  const lookups = useLookups()
  const action = useAction()
  const data = useQuery(
    async ({ repositories }) => {
      const [requests, contracts] = await Promise.all([repositories.hireRequests.findAll(), repositories.contracts.findAll()])
      const contracted = new Set(contracts.map((c) => c.hireRequestId))
      const approved = requests.filter((r) => r.status === 'APPROVED' && !contracted.has(r.id))
      return { approved, contracts: [...contracts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }
    },
    { approved: [], contracts: [] },
  )
  const nameOf = (id: string) => lookups.housekeeper.get(id)?.name ?? '—'

  function close() {
    setCreating(false)
    if (preselected) setParams({})
  }

  return (
    <>
      <PageHeader
        title="Contratos"
        subtitle={`${data.contracts.filter((c) => c.status === 'ACTIVE').length} contratos activos`}
        action={<button className="btn btn-primary" onClick={() => setCreating(true)}><Plus size={18} /> Novo contrato</button>}
      />
      <ErrorAlert message={action.error} />
      <div className="panel table-panel">
        <table>
          <thead>
            <tr><th>Candidata</th><th>Cliente</th><th>Salário</th><th>Comissão</th><th>Período</th><th>Estado</th><th aria-label="Acções" /></tr>
          </thead>
          <tbody>
            {data.contracts.map((c) => (
              <tr key={c.id}>
                <td><PersonCell id={c.housekeeperId} name={nameOf(c.housekeeperId)} /></td>
                <td>{lookups.client.get(c.clientId)?.name}</td>
                <td>{formatMZN(c.monthlySalary)}</td>
                <td>{formatMZN(commissionOf(c))}</td>
                <td>{formatDate(c.startDate)} → {formatDate(c.endDate)}</td>
                <td><StatusBadge status={c.status} /></td>
                <td className="row-actions">
                  {c.status === 'ACTIVE' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => action.run(() => container.useCases.endContract(c.id))}>Terminar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal title="Celebrar contrato" open={creating} onClose={close}>
        <ContractForm
          defaultRequestId={preselected}
          approvedRequests={data.approved.map((r) => ({
            id: r.id,
            label: `${nameOf(r.housekeeperId)} — ${lookups.client.get(r.clientId)?.name ?? ''}`,
          }))}
          onSubmit={container.useCases.signContract}
          onSuccess={() => {
            close()
            refresh()
          }}
        />
      </Modal>
    </>
  )
}
