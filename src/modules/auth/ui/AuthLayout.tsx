import { ShieldCheck, Star, UsersRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { Logo } from '../../../app/layout/Logo'
import { Portrait } from '../../../shared/ui/Portrait'

const HIGHLIGHTS = [
  { icon: ShieldCheck, text: 'Perfis com documentação verificada' },
  { icon: UsersRound, text: 'Agenciamento acompanhado do pedido ao contrato' },
  { icon: Star, text: 'Avaliações reais de clientes' },
]

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth-showcase">
        <div className="brand">
          <Logo />
          <span>
            <strong>LarLink</strong>
            <small>Agenciamento de Empregadas Domésticas</small>
          </span>
        </div>
        <div className="auth-copy">
          <p className="eyebrow">Pessoas certas. Lares felizes.</p>
          <h2>Encontre a empregada doméstica ideal</h2>
          <ul>
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text}><span className="stat-icon tone-blue"><Icon size={20} /></span>{text}</li>
            ))}
          </ul>
        </div>
        <Portrait seed="hero-larlink" className="auth-art" />
      </aside>
      <main className="auth-panel">
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
          <p className="auth-footer">{footer}</p>
        </div>
      </main>
    </div>
  )
}
