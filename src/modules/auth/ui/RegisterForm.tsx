import { Check, ImagePlus, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { ErrorAlert, SelectField, TextField } from '../../../shared/ui/fields'
import { useSubmit } from '../../../shared/ui/useSubmit'
import type { RegisterAccountCommand } from '../application/authentication'
import { PASSWORD_RULES, ROLES } from '../domain/Account'
import { PasswordField } from './PasswordField'

interface Props {
  onSubmit: (command: RegisterAccountCommand) => Promise<unknown>
  onSuccess?: () => void
}

const EMPTY: RegisterAccountCommand = {
  name: '',
  email: '',
  role: '',
  password: '',
  passwordConfirmation: '',
  acceptTerms: false,
  photo: null,
}

export function RegisterForm({ onSubmit, onSuccess }: Props) {
  const [form, setForm] = useState(EMPTY)
  const [photoError, setPhotoError] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const { errors, generalError, submitting, submit } = useSubmit(onSubmit, onSuccess)
  const set = <K extends keyof RegisterAccountCommand>(field: K) => (value: RegisterAccountCommand[K]) =>
    setForm({ ...form, [field]: value })

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!form.photo) { setPhotoError('Carregue uma fotografia de perfil para continuar.'); return }
    await submit(form)
  }

  useEffect(() => {
    if (!form.photo) { setPhotoPreview(''); return }
    const url = URL.createObjectURL(form.photo)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [form.photo])

  function selectPhoto(file?: File) {
    setPhotoError('')
    if (!file) { setForm({ ...form, photo: null }); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setPhotoError('Escolha uma imagem JPG, PNG ou WEBP.'); return }
    if (file.size > 3 * 1024 * 1024) { setPhotoError('A imagem deve ter no máximo 3 MB.'); return }
    setForm({ ...form, photo: file })
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Criar conta" noValidate>
      <ErrorAlert message={generalError} />
      <TextField id="register-name" label="Nome completo" value={form.name} onChange={set('name')} error={errors.name} />
      <div className="profile-photo-picker">
        <div className="profile-photo-preview">{photoPreview ? <img src={photoPreview} alt="Pré-visualização da fotografia de perfil" /> : <ImagePlus size={24} />}</div>
        <div className="profile-photo-copy"><label htmlFor="register-photo">Fotografia de perfil <span>Obrigatória · JPG, PNG ou WEBP · até 3 MB</span></label><input id="register-photo" type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => selectPhoto(event.target.files?.[0])} />{photoError && <small className="field-error" role="alert">{photoError}</small>}</div>
      </div>
      <div className="form-grid">
        <TextField id="register-email" label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} />
        <SelectField
          id="register-role"
          label="Tipo de conta"
          value={form.role}
          onChange={set('role')}
          options={Object.entries(ROLES).filter(([value]) => value === 'CLIENT' || value === 'CANDIDATE').map(([value, label]) => ({ value, label }))}
          error={errors.role}
        />
      </div>
      <PasswordField id="register-password" label="Palavra-passe" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
      <ul className="password-rules" aria-label="Requisitos da palavra-passe">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(form.password)
          return (
            <li key={rule.label} className={ok ? 'ok' : undefined} data-met={ok}>
              {ok ? <Check size={14} /> : <X size={14} />} {rule.label}
            </li>
          )
        })}
      </ul>
      <PasswordField
        id="register-confirmation"
        label="Confirmar palavra-passe"
        value={form.passwordConfirmation}
        onChange={set('passwordConfirmation')}
        error={errors.passwordConfirmation}
        autoComplete="new-password"
      />
      <div className="field">
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={form.acceptTerms}
            onChange={(e) => set('acceptTerms')(e.target.checked)}
            aria-invalid={!!errors.acceptTerms}
          />
          Aceito os termos de utilização e a política de privacidade
        </label>
        {errors.acceptTerms && <small className="field-error">{errors.acceptTerms}</small>}
      </div>
      <button type="submit" className="btn btn-primary btn-wide" disabled={submitting}>
        {submitting ? 'A criar conta…' : 'Criar conta'}
      </button>
    </form>
  )
}
