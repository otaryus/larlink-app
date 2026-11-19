import { Plus } from 'lucide-react'
import { useState } from 'react'
import { formatDate } from '../../../shared/domain/format'
import { newestFirst } from '../../../shared/domain/sorting'
import { useContainer, useQuery } from '../../../shared/ui/ContainerContext'
import { Modal } from '../../../shared/ui/Modal'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { ClientForm } from './ClientForm'

export function ClientsPage() {
  const { container, refresh } = useContainer()
  const [creating, setCreating] = useState(false)
  const data = useQuery(
    async ({ repositories }) => ({
      clients: newestFirst(await repositories.clients.findAll()),
      requests: await repositories.hireRequests.findAll(),
    }),
    { clients: [], requests: [] },
  )
  const requestCount = (id: string) => data.requests.filter((r) => r.clientId === id).length

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle={`${data.clients.length} clientes registados`}
        action={<button className="btn btn-primary" onClick={() => setCreating(true)}><Plus size={18} /> Novo cliente</button>}
      />
      <div className="panel table-panel">
        <table>
          <thead>
            <tr><th>Nome</th><th>Email</th><th>Telemóvel</th><th>Endereço</th><th>Pedidos</th><th>Registo</th></tr>
          </thead>
          <tbody>
            {data.clients.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td>{c.address}</td>
                <td>{requestCount(c.id)}</td>
                <td>{formatDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal title="Novo cliente" open={creating} onClose={() => setCreating(false)}>
        <ClientForm
          onSubmit={container.useCases.registerClient}
          onSuccess={() => {
            setCreating(false)
            refresh()
          }}
        />
      </Modal>
    </>
  )
}
