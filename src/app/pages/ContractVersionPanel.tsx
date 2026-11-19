import { useEffect, useState, type FormEvent } from 'react'
import { api, json } from '../../shared/api/client'

type Revision = { id:string; version:number; kind:string; content:string; reason:string; createdAt:string; createdBy:string }

export function ContractVersionPanel({ contractId, currentContent, canEdit=false }: { contractId:string; currentContent:string; canEdit?:boolean }) {
  const [versions,setVersions]=useState<Revision[]>([])
  const [content,setContent]=useState(currentContent)
  const [reason,setReason]=useState('')
  const [error,setError]=useState('')
  const [saving,setSaving]=useState(false)
  async function load(){try{setVersions(await api<Revision[]>(`/api/contracts/${contractId}/versions`));setError('')}catch(e){setError((e as Error).message)}}
  useEffect(()=>{void load()},[contractId])
  async function save(event:FormEvent){event.preventDefault();setSaving(true);setError('');try{await api(`/api/agent/contracts/${contractId}/versions`,{...json({content,reason}),method:'POST'});setReason('');await load()}catch(e){setError((e as Error).message)}finally{setSaving(false)}}
  return <details className="contract-version-panel"><summary>Histórico e versões ({versions.length})</summary>{error&&<p className="workspace-error" role="alert">{error}</p>}{versions.map(v=><article className="workspace-row" key={v.id}><div className="workspace-row-main"><strong>Versão {v.version} · {v.kind}</strong><span>{v.createdBy} · {new Date(v.createdAt).toLocaleString('pt-MZ')}</span><small>{v.reason}</small><details><summary>Ver conteúdo desta versão</summary><pre>{v.content}</pre></details></div></article>)}{canEdit&&<form className="workspace-form" onSubmit={save}><h4>Nova revisão ou adenda</h4><p>Antes das assinaturas será uma revisão da minuta; após formalização será criada uma adenda versionada.</p><label>Texto completo<textarea required minLength={30} maxLength={30000} rows={10} value={content} onChange={e=>setContent(e.target.value)}/></label><label>Motivo da alteração<input required minLength={5} maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Descreva por que o contrato está a ser alterado"/></label><button className="btn btn-soft" disabled={saving}>{saving?'A guardar…':'Guardar nova versão'}</button></form>}</details>
}
