import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROLES } from '../../modules/auth/domain/Account'
import { useAuth } from '../../modules/auth/ui/AuthContext'
import { Logo } from './Logo'

export function Topbar() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  return <header className="topbar role-topbar"><div className="brand"><Logo/><span><strong>LarLink</strong><small>Agenciamento com confiança</small></span></div><div className="topbar-actions"><div className="role-user"><strong>{session?.name}</strong><small>{session && ROLES[session.role]}</small></div><button className="btn btn-ghost" onClick={()=>{signOut();navigate('/entrar',{replace:true})}}><LogOut size={17}/> Sair</button></div></header>
}
