import { useState, type FormEvent } from 'react'
import { ErrorAlert, SelectField, TextAreaField } from '../../../shared/ui/fields'
import { useSubmit } from '../../../shared/ui/useSubmit'
import type { SubmitReviewCommand } from '../application/submitReview'

interface Props {
  contracts: { id: string; label: string }[]
  onSubmit: (command: SubmitReviewCommand) => Promise<unknown>
  onSuccess?: () => void
}

const RATINGS = [1, 2, 3, 4, 5]

export function ReviewForm({ contracts, onSubmit, onSuccess }: Props) {
  const [contractId, setContractId] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const { errors, generalError, submitting, submit } = useSubmit(onSubmit, onSuccess)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await submit({ contractId, rating, comment })
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Avaliação do serviço" noValidate>
      <ErrorAlert message={generalError} />
      <SelectField
        id="review-contract"
        label="Contrato"
        value={contractId}
        onChange={setContractId}
        options={contracts.map((c) => ({ value: c.id, label: c.label }))}
        error={errors.contractId}
      />
      <fieldset className="field" aria-invalid={!!errors.rating}>
        <legend>Nota</legend>
        <div className="stars">
          {RATINGS.map((n) => (
            <button
              key={n}
              type="button"
              className={n <= rating ? 'star on' : 'star'}
              aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
              aria-pressed={n === rating}
              onClick={() => setRating(n)}
            >
              ★
            </button>
          ))}
        </div>
        {errors.rating && <small className="field-error">{errors.rating}</small>}
      </fieldset>
      <TextAreaField id="review-comment" label="Comentário" value={comment} onChange={setComment} error={errors.comment} />
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        Enviar avaliação
      </button>
    </form>
  )
}
