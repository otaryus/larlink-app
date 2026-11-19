import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function FirstLoginPasswordPage() {
  const { session, changePassword, signOut } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('')
    if (password.length < 8 || !/\p{L}/u.test(password) || !/\d/.test(password) || !/[^\p{L}\d\s]/u.test(password)) { setError('Use pelo menos 8 caracteres, com letra, número e símbolo.'); return }
    if (password !== confirmation) { setError('As palavras-passe não coincidem.'); return }
    setBusy(true)
    try { await changePassword(password, confirmation); navigate('/', { replace: true }) }
    catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }

  return <main className="password-change-page"><section className="auth-card"><p className="eyebrow">SEGURANÇA DA CONTA</p><h1>Crie uma nova palavra-passe</h1><p className="muted">Olá, {session?.name}. Por segurança, troque a palavra-passe temporária para continuar.</p>{error&&<div className="workspace-error" role="alert">{error}</div>}<form onSubmit={submit}><label>Nova palavra-passe<input autoComplete="new-password" type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirmar palavra-passe<input autoComplete="new-password" type="password" minLength={8} required value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label><small className="workspace-hint">Pelo menos 8 caracteres com letra, número e símbolo.</small><button className="btn btn-primary btn-wide" disabled={busy}>{busy?'A actualizar…':'Actualizar e continuar'}</button></form><button className="btn btn-ghost btn-wide" onClick={()=>{signOut();navigate('/entrar',{replace:true})}}>Terminar sessão</button></section></main>
}
