import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { AuthLayout } from './AuthLayout'
import { LoginForm } from './LoginForm'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'

  return (
    <AuthLayout
      title="Bem-vindo de volta"
      subtitle="Entre na sua conta para continuar."
      footer={<>Ainda não tem conta? <Link to="/registar" className="link">Criar conta</Link></>}
    >
      <LoginForm onSubmit={signIn} onSuccess={() => navigate(from, { replace: true })} />
    </AuthLayout>
  )
}
