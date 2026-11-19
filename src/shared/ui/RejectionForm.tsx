import { useState, type FormEvent } from 'react'
import { ErrorAlert, TextAreaField } from './fields'
import { useSubmit } from './useSubmit'

interface Props {
  onConfirm: (reason: string) => Promise<unknown>
  onCancel: () => void
}

export function RejectionForm({ onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState('')
  const { errors, generalError, submitting, submit } = useSubmit(onConfirm)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await submit(reason)
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit} aria-label="Formulário de rejeição">
      <ErrorAlert message={generalError} />
      <TextAreaField id="rejection-reason" label="Motivo da rejeição" value={reason} onChange={setReason} error={errors.reason} />
      <div className="actions">
        <button type="submit" className="btn btn-danger" disabled={submitting}>
          Confirmar rejeição
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
