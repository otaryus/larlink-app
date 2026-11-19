import { Plus, Wallet, Percent } from 'lucide-react'
import { useState } from 'react'
import { formatDate, formatMonth, formatMZN } from '../../../shared/domain/format'
import { useContainer, useQuery } from '../../../shared/ui/ContainerContext'
import { Modal } from '../../../shared/ui/Modal'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { PersonCell } from '../../../shared/ui/PersonCell'
import { useLookups } from '../../../shared/ui/useLookups'
import { monthlyTotalOf } from '../../contracts/domain/Contract'
import { nextDueMonth, PAYMENT_METHODS } from '../domain/Payment'
import { PaymentForm } from './PaymentForm'

export function PaymentsPage() {
  const { container, refresh } = useContainer()
  const [creating, setCreating] = useState(false)
  const lookups = useLookups()
  const data = useQuery(
    async ({ repositories }) => ({
      contracts: await repositories.contracts.findAll(),
      payments: (await repositories.payments.findAll()).sort((a, b) => b.paidAt.localeCompare(a.paidAt)),
    }),
    { contracts: [], payments: [] },
  )
  const contractById = new Map(data.contracts.map((c) => [c.id, c]))
  const nameOf = (housekeeperId?: string) => (housekeeperId && lookups.housekeeper.get(housekeeperId)?.name) || '—'
  const total = data.payments.reduce((sum, p) => sum + p.totalAmount, 0)
  const commission = data.payments.reduce((sum, p) => sum + p.commissionAmount, 0)

  return (
    <>
      <PageHeader
        title="Pagamentos"
        subtitle="Salários e comissão da plataforma"
        action={<button className="btn btn-primary" onClick={() => setCreating(true)}><Plus size={18} /> Registar pagamento</button>}
      />
      <div className="kpi-row">
        <div className="stat-tile"><span className="stat-icon tone-blue"><Wallet size={22} /></span><strong>{formatMZN(total)}</strong><span>Total processado</span></div>
        <div className="stat-tile"><span className="stat-icon tone-green"><Percent size={22} /></span><strong>{formatMZN(commission)}</strong><span>Comissão da plataforma</span></div>
      </div>
      <div className="panel table-panel">
        <table>
          <thead>
            <tr><th>Candidata</th><th>Mês</th><th>Salário</th><th>Comissão</th><th>Total</th><th>Método</th><th>Data</th></tr>
          </thead>
          <tbody>
            {data.payments.map((p) => {
              const contract = contractById.get(p.contractId)
              return (
                <tr key={p.id}>
                  <td><PersonCell id={contract?.housekeeperId ?? p.id} name={nameOf(contract?.housekeeperId)} /></td>
                  <td>{formatMonth(p.referenceMonth)}</td>
                  <td>{formatMZN(p.salaryAmount)}</td>
                  <td>{formatMZN(p.commissionAmount)}</td>
                  <td><strong>{formatMZN(p.totalAmount)}</strong></td>
                  <td>{PAYMENT_METHODS[p.method]}</td>
                  <td>{formatDate(p.paidAt)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Modal title="Registar pagamento" open={creating} onClose={() => setCreating(false)}>
        <PaymentForm
          contracts={data.contracts
            .filter((c) => c.status === 'ACTIVE')
            .map((c) => ({
              id: c.id,
              label: `${nameOf(c.housekeeperId)} — ${lookups.client.get(c.clientId)?.name ?? ''}`,
              nextDueMonth: nextDueMonth(c, data.payments),
              monthlyTotal: monthlyTotalOf(c),
            }))}
          onSubmit={container.useCases.registerPayment}
          onSuccess={() => {
            setCreating(false)
            refresh()
          }}
        />
      </Modal>
    </>
  )
}
