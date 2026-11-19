import { useState, type FormEvent } from 'react'
import { CheckboxGroup, ErrorAlert, SelectField, TextAreaField, TextField } from '../../../shared/ui/fields'
import { useSubmit } from '../../../shared/ui/useSubmit'
import type { Client } from '../../clients/domain/Client'
import { SKILLS, WEEKDAYS, type Housekeeper, type Skill, type Weekday } from '../../housekeepers/domain/Housekeeper'
import type { SubmitHireRequestCommand } from '../application/submitHireRequest'

interface Props {
  housekeeper: Housekeeper
  clients: Client[]
  onSubmit: (command: SubmitHireRequestCommand) => Promise<unknown>
  onSuccess?: () => void
}

function pick<K extends string>(map: Record<K, string>, keys: K[]): Record<K, string> {
  return Object.fromEntries(keys.map((k) => [k, map[k]])) as Record<K, string>
}

export function HireRequestForm({ housekeeper, clients, onSubmit, onSuccess }: Props) {
  const [clientId, setClientId] = useState('')
  const [requiredSkills, setRequiredSkills] = useState<Skill[]>([])
  const [requiredDays, setRequiredDays] = useState<Weekday[]>([])
  const [startDate, setStartDate] = useState('')
  const [notes, setNotes] = useState('')
  const { errors, generalError, submitting, submit } = useSubmit(onSubmit, onSuccess)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await submit({ clientId, housekeeperId: housekeeper.id, requiredSkills, requiredDays, startDate, notes })
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Pedido de contratação" noValidate>
      <ErrorAlert message={generalError} />
      <div className="form-grid">
        <SelectField
          id="request-client"
          label="Cliente"
          value={clientId}
          onChange={setClientId}
          options={clients.map((c) => ({ value: c.id, label: c.name }))}
          error={errors.clientId}
        />
        <TextField id="request-start" label="Data de início" type="date" value={startDate} onChange={setStartDate} error={errors.startDate} />
      </div>
      <CheckboxGroup id="request-skills" label="Serviços pretendidos" options={pick(SKILLS, housekeeper.skills)} selected={requiredSkills} onChange={setRequiredSkills} error={errors.requiredSkills} />
      <CheckboxGroup id="request-days" label="Dias pretendidos" options={pick(WEEKDAYS, housekeeper.availability)} selected={requiredDays} onChange={setRequiredDays} error={errors.requiredDays} />
      <TextAreaField id="request-notes" label="Observações" value={notes} onChange={setNotes} error={errors.notes} />
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        Enviar pedido
      </button>
    </form>
  )
}
