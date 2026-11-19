import { useState, type FormEvent } from 'react'
import { CalendarDays, Clock3, MapPin, Send, WalletCards } from 'lucide-react'
import { workspaceUseCases } from '../apiContainer'
import { CurrencyInput } from '../../shared/ui/CurrencyInput'

export type NegotiationRequest = {
  id:string; status:string; monthlySalary:number; taskScope?:string; durationMonths?:number; hoursPerDay?:number;
  startDate?:string; startTime?:string; endTime?:string; district?:string; neighborhood?:string; notes?:string;
  requiredSkills?:string[]; requiredDays?:string[]; selectedTaskNames?:string; expiresAt?:string;
  housekeeper:{id:string;name:string;expectedSalary:number;account?:{id:string}}; client:{id:string;name:string}
}
export type SalaryProposal = {id:string;authorId:string;authorName:string;monthlySalary:number;status:string;message?:string;createdAt:string}

const money=(value:number)=>`${Number(value??0).toLocaleString('pt-MZ',{minimumFractionDigits:2,maximumFractionDigits:2})} MT`
const salaryStepBase=(value:number|string)=>Math.max(5000,Math.round(Number(value)/50)*50)
const days:Record<string,string>={MON:'Segunda',TUE:'Terça',WED:'Quarta',THU:'Quinta',FRI:'Sexta',SAT:'Sábado',SUN:'Domingo'}
const skills:Record<string,string>={CLEANING:'Limpeza',COOKING:'Cozinha',CHILDCARE:'Cuidado de crianças',ELDERLY_CARE:'Cuidado de idosos',LAUNDRY:'Lavandaria',GARDENING:'Jardinagem'}

export function NegotiationCard({request,proposals,client,worker,canRespond,accountId,busy,onAction}:{request:NegotiationRequest;proposals:SalaryProposal[];client:boolean;worker:boolean;canRespond:boolean;accountId?:string;busy:boolean;onAction:(run:()=>Promise<unknown>,success:string)=>void}){
  const [salary,setSalary]=useState('')
  const [message,setMessage]=useState('')
  const ownOpenProposal=proposals.some(proposal=>proposal.status==='OPEN'&&proposal.authorId===accountId)
  const otherOpenProposal=proposals.some(proposal=>proposal.status==='OPEN'&&proposal.authorId!==accountId)
  const canNegotiate=(client||worker)&&!ownOpenProposal&&['PENDING','APPROVED','EM_NEGOCIACAO','WORKER_DECLINED'].includes(request.status)
    &&(worker||otherOpenProposal||Number(request.monthlySalary)<Number(request.housekeeper.expectedSalary))
  const initialSalary=worker?Math.max(Number(request.monthlySalary),salaryStepBase(request.housekeeper.expectedSalary)):salaryStepBase(request.monthlySalary)
  const proposedSalary=Number(salary||initialSalary)
  const validSalary=Number.isInteger(proposedSalary)&&proposedSalary>=Math.max(5000,Number(request.monthlySalary))&&proposedSalary%50===0
    &&(!client||proposedSalary<Number(request.housekeeper.expectedSalary))
  function submit(event:FormEvent){event.preventDefault();if(!validSalary)return;onAction(()=>workspaceUseCases.actions.submitSalaryProposal(request.id,{monthlySalary:proposedSalary,message}).then(()=>{setSalary('');setMessage('')}),worker?'Proposta salarial enviada ao empregador.':'Contraproposta salarial enviada à trabalhadora.')}
  return <section className="workspace-card negotiation-card">
    <div className="workspace-card-heading"><div><span className="profile-kicker">Negociação do contrato · {request.status}</span><h2>{client?`Pedido para ${request.housekeeper.name}`:`Pedido de ${request.client.name}`}</h2><p>Reveja todos os termos antes de negociar o preço.</p></div><div className="match-score-badge">Oferta actual <strong>{money(request.monthlySalary)}</strong></div></div>
    <div className="candidate-profile-details contract-terms-grid">
      <div><span>Serviços e escopo</span><p>{request.selectedTaskNames||request.taskScope||'Não informado'}</p>{request.taskScope&&request.selectedTaskNames&&<small>{request.taskScope}</small>}</div>
      <div><span>Local do serviço</span><p><MapPin size={15}/> {request.district||'Distrito não informado'} · {request.neighborhood||'Bairro não informado'}</p></div>
      <div><span>Horário</span><p><Clock3 size={15}/> {request.startTime||'—'}–{request.endTime||'—'} · {request.hoursPerDay??'—'} h/dia</p></div>
      <div><span>Período</span><p><CalendarDays size={15}/> Início {request.startDate?new Date(`${request.startDate}T00:00:00`).toLocaleDateString('pt-MZ'):'—'} · {request.durationMonths??'—'} mês(es)</p></div>
      <div><span>Dias necessários</span><p>{request.requiredDays?.map(day=>days[day]??day).join(', ')||'Não informados'}</p></div>
      <div><span>Competências</span><p>{request.requiredSkills?.map(skill=>skills[skill]??skill).join(' · ')||'Não informadas'}</p></div>
      <div><span>Condições financeiras</span><p><WalletCards size={15}/> Oferta {money(request.monthlySalary)} · pretendido {money(request.housekeeper.expectedSalary)}</p></div>
      <div><span>Validade e observações</span><p>{request.expiresAt?`Válido até ${new Date(request.expiresAt).toLocaleString('pt-MZ')}`:'Prazo não informado'}</p><small>{request.notes||'Sem observações adicionais'}</small></div>
    </div>
    <h3>Histórico de propostas</h3>
    <div className="workspace-list">{proposals.map(proposal=><article className="workspace-row" key={proposal.id}><div className="workspace-row-main"><strong>{money(proposal.monthlySalary)} · {proposal.authorName}</strong><span>{new Date(proposal.createdAt).toLocaleString('pt-MZ')} · {proposal.status==='OPEN'?'A aguardar confirmação':proposal.status==='ACCEPTED'?'Negociação confirmada':proposal.status==='REJECTED'?'Recusada':proposal.status}</span><small>{proposal.message||'Sem observações'}</small></div>{canRespond&&proposal.status==='OPEN'&&proposal.authorId!==accountId&&<div className="workspace-actions"><button className="btn btn-primary btn-sm" disabled={busy} onClick={()=>onAction(()=>workspaceUseCases.actions.decideSalaryProposal(request.id,proposal.id,'ACCEPTED'),client?'Negociação confirmada pelo cliente. A minuta do contrato foi gerada.':'Proposta aceite. A minuta do contrato foi gerada.')}>{client?'Confirmar e aceitar proposta':'Aceitar proposta'}</button><button className="btn btn-ghost btn-sm" disabled={busy} onClick={()=>onAction(()=>workspaceUseCases.actions.decideSalaryProposal(request.id,proposal.id,'REJECTED'),'Proposta rejeitada.')}>Recusar proposta</button></div>}</article>)}</div>
    {canNegotiate&&<form className="workspace-form negotiation-form" onSubmit={submit}><h3>{worker?'Apresentar a sua proposta salarial':'Negociar o preço'}</h3><p className="workspace-hint">{worker?'Indique o salário mensal que aceita para este serviço. O empregador poderá aceitar, recusar ou enviar outra proposta.':'Reveja todos os termos e envie uma contraproposta mensal em passos de 50 MT.'}</p><label>{worker?'A sua proposta mensal (MT)':'Nova proposta mensal (MT)'}<span className="salary-stepper"><button type="button" className="btn btn-soft btn-sm" aria-label="Reduzir proposta em 50 MT" disabled={proposedSalary<=Math.max(5000,Number(request.monthlySalary))} onClick={()=>setSalary(String(Math.max(5000,Number(request.monthlySalary),proposedSalary-50)))}>− 50 MT</button><CurrencyInput aria-label={worker?'A sua proposta salarial mensal (MT)':'Nova proposta mensal (MT)'} min={Math.max(5000,Number(request.monthlySalary))} max={client?request.housekeeper.expectedSalary-1:undefined} step={50} value={salary||String(initialSalary)} onChange={setSalary}/><button type="button" className="btn btn-soft btn-sm" aria-label="Aumentar proposta em 50 MT" onClick={()=>setSalary(String(proposedSalary+50))}>+ 50 MT</button></span></label><label>Mensagem<input maxLength={500} value={message} onChange={event=>setMessage(event.target.value)} placeholder="Condições ou esclarecimentos"/></label><button className="btn btn-primary" disabled={busy||!validSalary}><Send size={16}/> Submeter proposta</button></form>}
  </section>
}
