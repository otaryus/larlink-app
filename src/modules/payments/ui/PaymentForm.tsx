import { useState, type FormEvent } from 'react'
import { formatMZN } from '../../../shared/domain/format'
import { ErrorAlert, SelectField, TextField } from '../../../shared/ui/fields'
import { useSubmit } from '../../../shared/ui/useSubmit'
import type { RegisterPaymentCommand } from '../application/registerPayment'
import { PAYMENT_METHODS, type PaymentMethod } from '../domain/Payment'

export interface PayableContractOption {
  id: string
  label: string
  nextDueMonth?: string
  monthlyTotal: number
}

interface Props {
  contracts: PayableContractOption[]
  onSubmit: (command: RegisterPaymentCommand) => Promise<unknown>
  onSuccess?: () => void
}

export function PaymentForm({ contracts, onSubmit, onSuccess }: Props) {
  const [contractId, setContractId] = useState('')
  const [referenceMonth, setReferenceMonth] = useState('')
  const [method, setMethod] = useState('')
  const [account, setAccount] = useState('')
  const { errors, generalError, submitting, submit } = useSubmit(onSubmit, onSuccess)
  const selected = contracts.find((c) => c.id === contractId)

  function selectContract(id: string) {
    setContractId(id)
    setReferenceMonth(contracts.find((c) => c.id === id)?.nextDueMonth ?? '')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await submit({ contractId, referenceMonth, method: method as PaymentMethod, account })
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Registo de pagamento" noValidate>
      <ErrorAlert message={generalError} />
      <div className="form-grid">
        <SelectField
          id="payment-contract"
          label="Contrato"
          value={contractId}
          onChange={selectContract}
          options={contracts.map((c) => ({ value: c.id, label: c.label }))}
          error={errors.contractId}
        />
        <TextField id="payment-month" label="Mês de referência" type="month" value={referenceMonth} onChange={setReferenceMonth} error={errors.referenceMonth} />
        <SelectField
          id="payment-method"
          label="Método"
          value={method}
          onChange={setMethod}
          options={Object.entries(PAYMENT_METHODS).map(([value, label]) => ({ value, label }))}
          error={errors.method}
        />
        <TextField
          id="payment-account"
          label={method === 'BANK_TRANSFER' ? 'NIB' : 'Número de telemóvel'}
          value={account}
          onChange={setAccount}
          error={errors.account}
        />
      </div>
      {selected && (
        <p className="summary">
          Total a pagar (salário + comissão): <strong>{formatMZN(selected.monthlyTotal)}</strong>
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        Registar pagamento
      </button>
    </form>
  )
}
