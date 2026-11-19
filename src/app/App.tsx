import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../modules/auth/ui/AuthContext'
import { LoginPage } from '../modules/auth/ui/LoginPage'
import { RegisterPage } from '../modules/auth/ui/RegisterPage'
import { AnonymousOnly, RequireAuth } from '../modules/auth/ui/RequireAuth'
import { RoleHomePage } from './pages/RoleHomePage'
import { FirstLoginPasswordPage } from '../modules/auth/ui/FirstLoginPasswordPage'
import { Sidebar } from './layout/Sidebar'
import { Topbar } from './layout/Topbar'
import { OperationsPage } from './pages/OperationsPage'
import { ProfileSettingsPage } from './pages/ProfileSettingsPage'

interface Props { onResetData?: () => Promise<void> }

function Shell() {
  return (
    <div className="app">
      <Topbar />
      <div className="app-body">
        <Sidebar />
        <main className="main">
          <Routes>
            <Route path="/propostas" element={<OperationsPage />} />
            <Route path="/faltas" element={<OperationsPage />} />
            <Route path="/extras" element={<OperationsPage />} />
            <Route path="/pagamentos" element={<OperationsPage />} />
            <Route path="/financeiro" element={<OperationsPage />} />
            <Route path="/tarefas" element={<OperationsPage />} />
            <Route path="/notificacoes" element={<OperationsPage />} />
            <Route path="/relatorios" element={<OperationsPage />} />
            <Route path="/auditoria" element={<OperationsPage />} />
            <Route path="/data-hora" element={<OperationsPage />} />
            <Route path="/configuracoes-financeiras" element={<OperationsPage />} />
            <Route path="/perfil" element={<ProfileSettingsPage />} />
            <Route path="*" element={<RoleHomePage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export function App(_props: Props) {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/entrar" element={<AnonymousOnly><LoginPage /></AnonymousOnly>} />
        <Route path="/registar" element={<AnonymousOnly><RegisterPage /></AnonymousOnly>} />
        <Route path="/actualizar-senha" element={<RequireAuth><FirstLoginPasswordPage /></RequireAuth>} />
        <Route path="*" element={<RequireAuth><Shell /></RequireAuth>} />
      </Routes>
    </AuthProvider>
  )
}
