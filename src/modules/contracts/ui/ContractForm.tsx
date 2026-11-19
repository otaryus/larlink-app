import { useState, type FormEvent } from 'react'
import { ErrorAlert, SelectField, TextField } from '../../../shared/ui/fields'
import { toNumber } from '../../../shared/ui/toNumber'
import { useSubmit } from '../../../shared/ui/useSubmit'
import type { SignContractCommand } from '../application/signContract'

export interface ApprovedRequestOption {
  id: string
  label: string
}

interface Props {
  approvedRequests: ApprovedRequestOption[]
  onSubmit: (command: SignContractCommand) => Promise<unknown>
  onSuccess?: () => void
  defaultRequestId?: string
}

export function ContractForm({ approvedRequests, onSubmit, onSuccess, defaultRequestId = '' }: Props) {
  const [hireRequestId, setHireRequestId] = useState(defaultRequestId)
  const [monthlySalary, setMonthlySalary] = useState('')
  const [durationMonths, setDurationMonths] = useState('')
  const { errors, generalError, submitting, submit } = useSubmit(onSubmit, onSuccess)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await submit({ hireRequestId, monthlySalary: toNumber(monthlySalary), durationMonths: toNumber(durationMonths) })
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Celebração de contrato" noValidate>
      <ErrorAlert message={generalError} />
      <div className="form-grid">
        <SelectField
          id="contract-request"
          label="Pedido aprovado"
          value={hireRequestId}
          onChange={setHireRequestId}
          options={approvedRequests.map((r) => ({ value: r.id, label: r.label }))}
          error={errors.hireRequestId}
        />
        <TextField id="contract-salary" label="Salário mensal (MZN)" type="currency" value={monthlySalary} onChange={setMonthlySalary} error={errors.monthlySalary} />
        <TextField id="contract-duration" label="Duração (meses)" type="number" value={durationMonths} onChange={setDurationMonths} error={errors.durationMonths} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        Celebrar contrato
      </button>
    </form>
  )
}
