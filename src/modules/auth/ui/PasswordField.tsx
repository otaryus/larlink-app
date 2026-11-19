import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

interface Props {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  autoComplete: 'current-password' | 'new-password'
}

export function PasswordField({ id, label, value, onChange, error, autoComplete }: Props) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          className="icon-btn"
          aria-label={visible ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <small id={`${id}-error`} className="field-error">{error}</small>}
    </div>
  )
}
