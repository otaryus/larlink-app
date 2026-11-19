import { useState, type FormEvent } from 'react'
import { ErrorAlert, TextField } from '../../../shared/ui/fields'
import { useSubmit } from '../../../shared/ui/useSubmit'
import type { SignInCommand } from '../application/authentication'
import { PasswordField } from './PasswordField'

interface Props {
  onSubmit: (command: SignInCommand) => Promise<unknown>
  onSuccess?: () => void
}

export function LoginForm({ onSubmit, onSuccess }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { errors, generalError, submitting, submit } = useSubmit(onSubmit, onSuccess)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await submit({ email, password })
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Entrar" noValidate>
      <ErrorAlert message={generalError} />
      <TextField id="login-email" label="Email" type="email" value={email} onChange={setEmail} error={errors.email} placeholder="nome@exemplo.co.mz" />
      <PasswordField id="login-password" label="Palavra-passe" value={password} onChange={setPassword} error={errors.password} autoComplete="current-password" />
      <button type="submit" className="btn btn-primary btn-wide" disabled={submitting}>
        {submitting ? 'A entrar…' : 'Entrar'}
      </button>
    </form>
  )
}
