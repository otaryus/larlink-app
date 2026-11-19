import { useState, type FormEvent } from 'react'

interface Props {
  expectedName: string
  busy: boolean
  onSign: (fullName: string, contractRead: boolean) => void
}

export function ContractSignatureForm({ expectedName, busy, onSign }: Props) {
  const [fullName, setFullName] = useState('')
  const [contractRead, setContractRead] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (contractRead && fullName === expectedName) onSign(fullName, contractRead)
  }

  return (
    <form className="workspace-form contract-signature-form" onSubmit={submit}>
      <h3>Assinatura electrónica — sua confirmação</h3>
      <p>Este espaço fica abaixo do contrato. Confirme a leitura e assine com o nome completo registado.</p>
      <label>
        <input
          type="checkbox"
          checked={contractRead}
          onChange={(event) => setContractRead(event.target.checked)}
        />
        Li e concordo com o conteúdo integral do contrato acima.
      </label>
      <label>
        Digite o seu nome completo exactamente como está no registo
        <input
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder={expectedName}
          aria-label="Nome completo para assinatura"
        />
      </label>
      <button className="btn btn-primary" disabled={busy || !contractRead || fullName !== expectedName}>
        Confirmar e assinar
      </button>
    </form>
  )
}
