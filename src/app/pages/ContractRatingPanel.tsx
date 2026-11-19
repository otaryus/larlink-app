import { useEffect, useState, type FormEvent } from 'react'
import { api, json } from '../../shared/api/client'

type Rating={id:string;authorId:string;authorName:string;score:number;comment:string;createdAt:string}
type RatingState={eligible:boolean;ratings:Rating[];average:number;submittedByMe:boolean}

export function ContractRatingPanel({contractId}:{contractId:string}){
  const [state,setState]=useState<RatingState|null>(null)
  const [score,setScore]=useState(5)
  const [comment,setComment]=useState('')
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const [reload,setReload]=useState(0)
  useEffect(()=>{let active=true;api<RatingState>(`/api/contracts/${contractId}/ratings`).then(v=>{if(active)setState(v)}).catch(e=>{if(active)setError((e as Error).message)});return()=>{active=false}},[contractId,reload])
  async function submit(event:FormEvent){event.preventDefault();setBusy(true);setError('');try{await api(`/api/contracts/${contractId}/ratings`,json({score,comment}));setReload(v=>v+1)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  if(!state)return <section className="contract-rating-panel"><h4>Avaliações</h4>{error?<p className="workspace-error">{error}</p>:<p className="workspace-hint">A carregar avaliações…</p>}</section>
  return <section className="contract-rating-panel"><header><div><h4>Avaliações do serviço</h4><p>{state.ratings.length?`${state.average.toLocaleString('pt-MZ')} / 5 · ${state.ratings.length} avaliação(ões)`:'Ainda sem avaliações'}</p></div></header>{state.ratings.map(r=><article className="contract-rating" key={r.id}><strong>{'★'.repeat(r.score)}{'☆'.repeat(5-r.score)} <span>{r.authorName}</span></strong>{r.comment&&<p>{r.comment}</p>}<small>{new Date(r.createdAt).toLocaleDateString('pt-MZ')}</small></article>)}{state.eligible&&!state.submittedByMe?<form className="workspace-form" onSubmit={submit}><label>A sua avaliação<select value={score} onChange={e=>setScore(Number(e.target.value))}><option value="5">5 estrelas · Excelente</option><option value="4">4 estrelas · Muito bom</option><option value="3">3 estrelas · Bom</option><option value="2">2 estrelas · A melhorar</option><option value="1">1 estrela · Insatisfatório</option></select></label><label>Comentário (opcional)<textarea maxLength={1000} rows={3} value={comment} onChange={e=>setComment(e.target.value)} placeholder="Partilhe uma experiência respeitosa e útil"/></label>{error&&<div className="workspace-error" role="alert">{error}</div>}<button className="btn btn-soft" disabled={busy}>{busy?'A enviar…':'Enviar avaliação'}</button></form>:!state.eligible?<p className="workspace-hint">A avaliação fica disponível após o primeiro pagamento confirmado ou o encerramento do contrato.</p>:<p className="workspace-success">A sua avaliação foi registada.</p>}</section>
}
