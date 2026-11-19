import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { AuthLayout } from './AuthLayout'
import { RegisterForm } from './RegisterForm'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Registe-se para encontrar ou oferecer serviços domésticos."
      footer={<>Já tem conta? <Link to="/entrar" className="link">Entrar</Link></>}
    >
      <RegisterForm onSubmit={register} onSuccess={() => navigate('/', { replace: true })} />
    </AuthLayout>
  )
}
