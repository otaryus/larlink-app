import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../modules/auth/ui/AuthContext'
import { CITIES, SKILLS, WEEKDAYS, type Skill, type Weekday } from '../../modules/housekeepers/domain/Housekeeper'
import { profileUseCases } from '../apiContainer'
import type { ClientProfile, WorkerProfileDraft } from '../../modules/profile/domain/Profile'
import { CurrencyInput } from '../../shared/ui/CurrencyInput'
import { ValidationError } from '../../shared/domain/errors'

export function ProfileSettingsPage() {
  const { session } = useAuth()
  const worker = session?.role === 'CANDIDATE' || session?.role === 'HOUSEKEEPER'
  const [workerData, setWorkerData] = useState<WorkerProfileDraft | null>(null)
  const [clientData, setClientData] = useState<ClientProfile>({ phone: '', address: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    void profileUseCases.loadProfile(worker ? 'worker' : 'client')
      .then((profile) => {
        if (!active) return
        if (worker) setWorkerData(profile as WorkerProfileDraft)
        else setClientData(profile as ClientProfile)
      })
      .catch((cause: unknown) => {
        if (active) setError((cause as Error).message)
      })
    return () => { active = false }
  }, [worker])

  async function save(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      if (worker && workerData) {
        await profileUseCases.saveProfile({ kind: 'worker', profile: workerData })
      } else if (!worker) {
        await profileUseCases.saveProfile({ kind: 'client', profile: clientData })
      }
      setSuccess(worker ? 'Perfil actualizado e enviado para nova validação.' : 'Contactos actualizados.')
    } catch (cause) {
      setError(cause instanceof ValidationError
        ? Object.values(cause.fields).join(' ')
        : (cause as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function toggle<T extends string>(value: T, list: T[], set: (values: T[]) => void) {
    set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value])
  }

  return (
    <div className="workspace-page">
      <header className="workspace-heading">
        <div className="workspace-heading-icon">👤</div>
        <div>
          <h1>O meu perfil</h1>
          <p>Mantenha os seus dados actualizados para facilitar o acompanhamento.</p>
        </div>
      </header>
      {error && <div className="workspace-error" role="alert">{error}</div>}
      {success && <div className="workspace-success" role="status">{success}</div>}
      {worker && workerData && (
        <form className="workspace-card workspace-form" onSubmit={save}>
          <h2>Informações profissionais</h2>
          <label>Data de nascimento<input required type="date" max={new Date().toISOString().slice(0, 10)} value={workerData.birthDate} onChange={(event) => setWorkerData({ ...workerData, birthDate: event.target.value })} /></label>
          <label>Telefone<input required type="tel" autoComplete="tel" maxLength={20} value={workerData.phone} onChange={(event) => setWorkerData({ ...workerData, phone: event.target.value })} /></label>
          <label>Cidade<select required value={workerData.city} onChange={(event) => setWorkerData({ ...workerData, city: event.target.value })}>{CITIES.map((city) => <option key={city}>{city}</option>)}</select></label>
          <label>Bairro<input required minLength={3} maxLength={100} value={workerData.neighborhood} onChange={(event) => setWorkerData({ ...workerData, neighborhood: event.target.value })} /></label>
          <label>Salário mensal pretendido (MT)<CurrencyInput required min="5000" step="50" value={workerData.expectedSalary} onChange={(value) => setWorkerData({ ...workerData, expectedSalary: value })} /></label>
          <label>Anos de experiência<input required type="number" min="0" max="50" step="1" value={workerData.yearsOfExperience} onChange={(event) => setWorkerData({ ...workerData, yearsOfExperience: event.target.value })} /></label>
          <fieldset>
            <legend>Competências</legend>
            <div className="profile-choice-grid">
              {Object.entries(SKILLS).map(([code, label]) => (
                <label key={code}><input type="checkbox" checked={workerData.skills.includes(code as Skill)} onChange={() => toggle(code as Skill, workerData.skills, (skills) => setWorkerData({ ...workerData, skills }))} />{label}</label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Disponibilidade</legend>
            <div className="profile-choice-grid">
              {Object.entries(WEEKDAYS).map(([code, label]) => (
                <label key={code}><input type="checkbox" checked={workerData.availability.includes(code as Weekday)} onChange={() => toggle(code as Weekday, workerData.availability, (availability) => setWorkerData({ ...workerData, availability }))} />{label}</label>
              ))}
            </div>
          </fieldset>
          <p className="workspace-hint">Alterar competências, disponibilidade ou pretensão salarial envia o perfil para nova validação da agência.</p>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'A guardar…' : 'Guardar perfil'}</button>
        </form>
      )}
      {!worker && (
        <form className="workspace-card workspace-form" onSubmit={save}>
          <h2>Contactos do cliente</h2>
          <label>Telefone<input required type="tel" autoComplete="tel" maxLength={20} value={clientData.phone} onChange={(event) => setClientData({ ...clientData, phone: event.target.value })} /></label>
          <label>Endereço de prestação do serviço<input required minLength={5} maxLength={500} autoComplete="street-address" value={clientData.address} onChange={(event) => setClientData({ ...clientData, address: event.target.value })} /></label>
          <button className="btn btn-primary" disabled={busy}>Guardar contactos</button>
        </form>
      )}
    </div>
  )
}
