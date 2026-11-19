import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { formatMZN } from '../../shared/domain/format'
import {
  AGENCY_COMMISSION_RATE,
  MAX_CONTRACT_MONTHS,
  MIN_HOUSEKEEPER_AGE,
  MINIMUM_WAGE_MZN,
} from '../../shared/domain/policies'
import { useContainer } from '../../shared/ui/ContainerContext'
import { SuccessAlert } from '../../shared/ui/fields'
import { PageHeader } from '../../shared/ui/PageHeader'
import { ROLES } from '../../modules/auth/domain/Account'
import { useAuth } from '../../modules/auth/ui/AuthContext'

const POLICIES = [
  ['Salário mínimo', formatMZN(MINIMUM_WAGE_MZN)],
  ['Comissão da plataforma', `${AGENCY_COMMISSION_RATE * 100}% sobre o salário`],
  ['Duração máxima de contrato', `${MAX_CONTRACT_MONTHS} meses`],
  ['Idade mínima da candidata', `${MIN_HOUSEKEEPER_AGE} anos`],
]

export function SettingsPage({ onResetData }: { onResetData?: () => Promise<void> }) {
  const { refresh } = useContainer()
  const { session } = useAuth()
  const [done, setDone] = useState(false)

  return (
    <>
      <PageHeader title="Configurações" subtitle="Conta e políticas da plataforma" />
      <div className="settings-layout">
        <section className="panel">
          <h2 className="section-title">Conta</h2>
          <dl className="definition">
            <dt>Utilizador</dt><dd>{session?.name}</dd>
            <dt>Email</dt><dd>{session?.email}</dd>
            <dt>Perfil</dt><dd>{session && ROLES[session.role]}</dd>
          </dl>
        </section>
        <section className="panel">
          <h2 className="section-title">Políticas de negócio</h2>
          <dl className="definition">
            {POLICIES.map(([label, value]) => (
              <div key={label} className="definition-row"><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </section>
        {onResetData && (
          <section className="panel">
            <h2 className="section-title">Dados de demonstração</h2>
            <p className="muted">Repõe os dados fictícios iniciais. As alterações feitas serão perdidas.</p>
            <SuccessAlert message={done ? 'Dados repostos.' : null} />
            <button
              className="btn btn-ghost"
              onClick={async () => {
                await onResetData()
                setDone(true)
                refresh()
              }}
            >
              <RotateCcw size={16} /> Repor dados fictícios
            </button>
          </section>
        )}
      </div>
    </>
  )
}
