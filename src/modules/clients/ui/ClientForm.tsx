import { useState, type FormEvent } from 'react'
import { ErrorAlert, TextField } from '../../../shared/ui/fields'
import { useSubmit } from '../../../shared/ui/useSubmit'
import type { RegisterClientCommand } from '../application/registerClient'

const EMPTY: RegisterClientCommand = { name: '', email: '', phone: '', address: '' }

interface Props {
  onSubmit: (command: RegisterClientCommand) => Promise<unknown>
  onSuccess?: () => void
}

export function ClientForm({ onSubmit, onSuccess }: Props) {
  const [form, setForm] = useState(EMPTY)
  const { errors, generalError, submitting, submit } = useSubmit(onSubmit, onSuccess)

  const set = (field: keyof RegisterClientCommand) => (value: string) => setForm({ ...form, [field]: value })

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (await submit(form)) setForm(EMPTY)
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Registo de cliente" noValidate>
      <ErrorAlert message={generalError} />
      <div className="form-grid">
        <TextField id="client-name" label="Nome completo" value={form.name} onChange={set('name')} error={errors.name} />
        <TextField id="client-email" label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} />
        <TextField id="client-phone" label="Telemóvel" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="84 123 4567" />
        <TextField id="client-address" label="Endereço" value={form.address} onChange={set('address')} error={errors.address} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        Registar cliente
      </button>
    </form>
  )
}
