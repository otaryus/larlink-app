import type { ReactNode } from 'react'
import { CurrencyInput } from './CurrencyInput'

interface BaseField {
  id: string
  label: string
  error?: string
  hint?: string
}

function Messages({ id, error, hint }: Pick<BaseField, 'id' | 'error' | 'hint'>) {
  return (
    <>
      {hint && !error && <small className="hint">{hint}</small>}
      {error && (
        <small id={`${id}-error`} className="field-error">
          {error}
        </small>
      )}
    </>
  )
}

function a11y(id: string, error?: string) {
  return { 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-error` : undefined }
}

export function TextField({
  id,
  label,
  error,
  hint,
  value,
  onChange,
  type = 'text',
  placeholder,
}: BaseField & { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {type === 'currency' ? (
        <CurrencyInput
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          {...a11y(id, error)}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          {...a11y(id, error)}
        />
      )}
      <Messages id={id} error={error} hint={hint} />
    </div>
  )
}

export function TextAreaField({
  id,
  label,
  error,
  hint,
  value,
  onChange,
}: BaseField & { value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} rows={3} value={value} onChange={(e) => onChange(e.target.value)} {...a11y(id, error)} />
      <Messages id={id} error={error} hint={hint} />
    </div>
  )
}

export function SelectField({
  id,
  label,
  error,
  hint,
  value,
  onChange,
  options,
  placeholder = 'Seleccione…',
}: BaseField & {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} {...a11y(id, error)}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Messages id={id} error={error} hint={hint} />
    </div>
  )
}

export function CheckboxGroup<K extends string>({
  id,
  label,
  error,
  options,
  selected,
  onChange,
}: BaseField & {
  options: Record<K, string>
  selected: K[]
  onChange: (v: K[]) => void
}) {
  function toggle(key: K) {
    onChange(selected.includes(key) ? selected.filter((s) => s !== key) : [...selected, key])
  }
  return (
    <fieldset className="field group" {...a11y(id, error)}>
      <legend>{label}</legend>
      <div className="options">
        {(Object.entries(options) as [K, string][]).map(([key, text]) => (
          <label key={key} className="option">
            <input type="checkbox" checked={selected.includes(key)} onChange={() => toggle(key)} />
            {text}
          </label>
        ))}
      </div>
      <Messages id={id} error={error} />
    </fieldset>
  )
}

export function ErrorAlert({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div role="alert" className="alert alert-error">
      {message}
    </div>
  )
}

export function SuccessAlert({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div role="status" className="alert alert-success">
      {message}
    </div>
  )
}

export function Card({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="card">
      <header className="card-header">
        <h2>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  )
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  CANCELLED: 'Cancelado',
  ACTIVE: 'Activo',
  TERMINATED: 'Terminado',
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{STATUS_LABELS[status] ?? status}</span>
}
