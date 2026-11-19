import { useEffect, useState, type FormEvent } from 'react'
import { BriefcaseBusiness, Check, MapPin, Search, ShieldCheck, X } from 'lucide-react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../modules/auth/ui/AuthContext'
import { SKILLS, WEEKDAYS } from '../../modules/housekeepers/domain/Housekeeper'
import { DEFAULT_AREA, DEFAULT_DISTRICT, districtsForArea, MOZAMBIQUE_AREAS } from '../../data/mozambiqueLocations'
import { CurrencyInput } from '../../shared/ui/CurrencyInput'
import { ProfilePhoto } from '../../shared/ui/ProfilePhoto'
import { workspaceUseCases } from '../apiContainer'
import type {
  WorkspaceClientProfile as ClientProfile,
  WorkspaceContract as ContractRow,
  WorkspaceDashboard as Dashboard,
  WorkspaceIncident as IncidentRow,
  WorkspaceIncidentMessage as IncidentMessageRow,
  WorkspaceNegotiation,
  WorkspacePartyIncident as PartyIncident,
  WorkspaceRequest as RequestRow,
  WorkspaceTask as AgencyTask,
  WorkspaceWorker as Worker,
} from '../../modules/workspace/domain/Workspace'
import { ContractVersionPanel } from './ContractVersionPanel'
import { ContractRatingPanel } from './ContractRatingPanel'
import { ContractSignatureForm } from './ContractSignatureForm'
import { NegotiationCard } from './NegotiationCard'

type WorkerProposalRow = WorkspaceNegotiation

function tomorrow() { const date = new Date(); date.setDate(date.getDate()+1); return date.toISOString().slice(0,10) }
function normalizedArea(value:string) { const normalized=value.trim().toLocaleLowerCase('pt'); return ({maputo:'cidade de maputo',matola:'província de maputo',beira:'sofala','xai-xai':'gaza'} as Record<string,string>)[normalized]??normalized }
function validIncidentFile(file:File|null) { return !file || (file.size<=5_000_000&&['application/pdf','image/jpeg','image/png'].includes(file.type)) }
function statusLabel(status:string) { return ({PENDING:'Pedido directo à candidata',APPROVED:'À espera da trabalhadora',EM_NEGOCIACAO:'Em negociação salarial',WORKER_ACCEPTED:'Aceite pela trabalhadora',WORKER_DECLINED:'Recusado pela trabalhadora',REJECTED:'Não aprovado',CANCELLED:'Cancelado'} as Record<string,string>)[status] ?? status }
function contractStatusLabel(contract:Pick<ContractRow,'status'|'agencyReviewed'|'agencyReviewState'|'clientSigned'|'workerSigned'>) {
  if(contract.status==='TERMINATED')return 'Encerrado'
  if(contract.status==='ACTIVE')return 'Activo — assinado pelas duas partes'
  if(!contract.agencyReviewed)return contract.agencyReviewState==='CHANGES_REQUESTED'?'Aguarda alterações da minuta':'Aguardando revisão da agência'
  if(!contract.clientSigned||!contract.workerSigned)return 'Aguardando assinaturas'
  return 'Assinado pelas duas partes'
}
function workStartStatusLabel(contract:Pick<ContractRow,'clientConfirmedStart'|'workerConfirmedStart'|'workStarted'>, isClient:boolean) {
  if(contract.workStarted)return 'Início confirmado pelas duas partes.'
  if(contract.clientConfirmedStart&&contract.workerConfirmedStart)return 'Início confirmado pelas duas partes.'
  const ownConfirmation=isClient?contract.clientConfirmedStart:contract.workerConfirmedStart
  const otherConfirmation=isClient?contract.workerConfirmedStart:contract.clientConfirmedStart
  if(ownConfirmation)return 'Confirmação registada. Aguardando a outra parte confirmar o início.'
  if(otherConfirmation)return 'A outra parte já confirmou. Confirme o início para finalizar.'
  return 'Confirme apenas quando o trabalho tiver começado.'
}
function formatLocalDate(value:string) {
  const [year,month,day]=value.split('-').map(Number)
  return new Date(year,month-1,day).toLocaleDateString('pt-MZ')
}
function ErrorMessage({ value }: {value:string}) { return value ? <div className="workspace-error" role="alert">{value}</div> : null }

export function RoleHomePage() {
  const { session, updateRole } = useAuth()
  const { pathname } = useLocation()
  const [refresh, setRefresh] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [client, setClient] = useState<ClientProfile | null>(null)
  const [worker, setWorker] = useState<Worker | null>(null)
  const [workerPhotoFile, setWorkerPhotoFile] = useState<File | null>(null)
  const [photoRevision, setPhotoRevision] = useState(0)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [workerRequests, setWorkerRequests] = useState<RequestRow[]>([])
  const [workerProposalRows, setWorkerProposalRows] = useState<WorkerProposalRow[]>([])
  const [contractsList, setContractsList] = useState<ContractRow[]>([])
  const [serverDate, setServerDate] = useState('')
  const [incidents, setIncidents] = useState<IncidentRow[]>([])
  const [partyIncidents, setPartyIncidents] = useState<PartyIncident[]>([])
  const [incidentMessages, setIncidentMessages] = useState<Record<string,IncidentMessageRow[]>>({})
  const [incidentFiles, setIncidentFiles] = useState<Record<string,File|null>>({})
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [matches, setMatches] = useState<Worker[]>([])
  const [profilePreview, setProfilePreview] = useState<Worker|null>(null)
  const [requestError, setRequestError] = useState<{ workerId:string; message:string } | null>(null)
  const [city, setCity] = useState(DEFAULT_AREA)
  const [district, setDistrict] = useState(DEFAULT_DISTRICT)
  const [neighborhood, setNeighborhood] = useState('')
  const [taskCatalog, setTaskCatalog] = useState<AgencyTask[]>([])
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [maxSalary, setMaxSalary] = useState('')
  const [requiredDays, setRequiredDays] = useState<string[]>(['MON','TUE','WED','THU','FRI'])
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('16:00')
  const [startDate, setStartDate] = useState(tomorrow())
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchStage, setSearchStage] = useState(0)
  const [searchStep, setSearchStep] = useState(1)
  const [taskScope, setTaskScope] = useState('')
  const [monthlySalary, setMonthlySalary] = useState('')
  const [durationMonths, setDurationMonths] = useState('12')
  const [agentForm, setAgentForm] = useState({ name:'', email:'', role:'SECRETARY', phone:'', address:'', photo:null as File|null })
  const [newCredentials, setNewCredentials] = useState<{name:string;email:string;role:string;temporaryPassword:string}|null>(null)
  const [incidentDrafts, setIncidentDrafts] = useState<Record<string,string>>({})
  const [profileForm, setProfileForm] = useState({ phone:'', address:'' })
  const [workerForm, setWorkerForm] = useState({ birthDate:'', phone:'', city:DEFAULT_AREA, district:DEFAULT_DISTRICT, neighborhood:'', skills:['CLEANING'], availability:['MON'], expectedSalary:'5000', yearsOfExperience:'0' })
  const role = session?.role
  const selectedSkillCodes=[...new Set(taskCatalog.filter(t=>selectedTaskIds.includes(t.id)).map(t=>t.skillCode))]
  const isAgent = role === 'AGENCY'
  const isSecretary = role === 'SECRETARY'
  const isClient = role === 'CLIENT'
  const isWorker = role === 'HOUSEKEEPER' || role === 'CANDIDATE'
  const allowedPaths = isAgent ? ['/','/candidatas','/agenciamentos','/contratos','/ocorrencias','/agentes'] : isSecretary ? ['/','/candidatas','/agenciamentos'] : isClient ? ['/','/perfil','/agenciamentos','/contratos','/ocorrencias'] : ['/','/perfil','/contratos','/ocorrencias']

  useEffect(() => {
    if (!searching) return
    const timer = window.setInterval(() => setSearchStage((stage) => Math.min(stage + 1, 2)), 650)
    return () => window.clearInterval(timer)
  }, [searching])

  useEffect(() => {
    let active = true
    setError('')
    async function load() {
      try {
        const snapshot = await workspaceUseCases.loadRoleHome({ role: role ?? '', pathname })
        if (!active) return
        if (snapshot.tasks) setTaskCatalog(snapshot.tasks)
        if ('client' in snapshot) setClient(snapshot.client ?? null)
        if ('worker' in snapshot) {
          const result = snapshot.worker
          setWorker(result ?? null)
          if (result) setWorkerForm({
            birthDate: result.birthDate ?? '',
            phone: result.phone ?? '',
            city: result.city,
            district: result.district ?? '',
            neighborhood: result.neighborhood,
            skills: result.skills ?? [],
            availability: result.availability ?? [],
            expectedSalary: String(result.expectedSalary),
            yearsOfExperience: String(result.yearsOfExperience),
          })
        }
        if (snapshot.workers) setWorkers(snapshot.workers)
        if (snapshot.requests) setRequests(snapshot.requests)
        if (snapshot.workerRequests) setWorkerRequests(snapshot.workerRequests)
        if (snapshot.workerProposalRows) setWorkerProposalRows(snapshot.workerProposalRows)
        if (snapshot.contractsList) setContractsList(snapshot.contractsList)
        if (snapshot.incidents) setIncidents(snapshot.incidents)
        if (snapshot.partyIncidents) setPartyIncidents(snapshot.partyIncidents)
        if (snapshot.incidentMessages) setIncidentMessages(snapshot.incidentMessages)
        if (snapshot.dashboard) setDashboard(snapshot.dashboard)
      } catch (e) { if (active) setError((e as Error).message) }
    }
    void load()
    const poll = isAgent||isSecretary ? window.setInterval(() => setRefresh((value) => value + 1), 15000) : undefined
    return () => { active = false; if (poll) window.clearInterval(poll) }
  }, [isAgent, isSecretary, isClient, isWorker, pathname, refresh, role])

  useEffect(() => {
    if ((!isClient && !isWorker) || !pathname.includes('contratos')) return
    let active = true
    async function refreshServerState() {
      try {
        const { contracts, serverDate } = await workspaceUseCases.loadContractTimeline()
        if (active) {
          setContractsList(contracts)
          setServerDate(serverDate)
        }
      } catch (e) {
        if (active) setError((e as Error).message)
      }
    }
    void refreshServerState()
    const poll = window.setInterval(() => void refreshServerState(), 10000)
    return () => { active = false; window.clearInterval(poll) }
  }, [isClient, isWorker, pathname])

  async function search(event: FormEvent) {
    event.preventDefault(); setError(''); setSuccess(''); setBusy(true); setSearching(true); setSearchStage(0); setMatches([])
    const startedAt = Date.now()
    try {
      if(!selectedTaskIds.length){setError('Seleccione pelo menos uma tarefa doméstica.');setSearching(false);setBusy(false);return}
      if(!requiredDays.length){setError('Seleccione pelo menos um dia de trabalho.');setSearching(false);setBusy(false);return}
      if(!district){setError('Seleccione o distrito da área de trabalho.');setSearching(false);setBusy(false);return}
      if(endTime<=startTime){setError('A hora de saída deve ser posterior à hora de entrada.');setSearching(false);setBusy(false);return}
      if(taskScope.trim().length<15){setError('Descreva as tarefas desejadas com pelo menos 15 caracteres.');setSearching(false);setBusy(false);return}
      if(!monthlySalary||Number(monthlySalary)<5000||!Number.isInteger(Number(monthlySalary))||Number(monthlySalary)%50!==0){setError('Indique um salário mensal a partir de 5.000 MZN, em incrementos de 50 MT.');setSearching(false);setBusy(false);return}
      const result = await workspaceUseCases.searchMatching({ city, district, neighborhood:neighborhood.trim()||undefined, skills:selectedSkillCodes, availability:requiredDays, maxSalary:Number(maxSalary)>0 ? Number(maxSalary) : undefined, text:taskScope.trim() || undefined })
      // Keep the presentation safe even when an older API process is still running.
      const eligible = result.filter(w => w.status==='APPROVED'
        && normalizedArea(w.city)===normalizedArea(city)
        && selectedSkillCodes.every(skill=>w.skills?.includes(skill))
        && requiredDays.every(day=>w.availability?.includes(day))
        && (!(Number(maxSalary)>0) || w.expectedSalary<=Number(maxSalary)))
      const remaining = Math.max(0, 1500 - (Date.now() - startedAt))
      if (remaining) await new Promise((resolve) => window.setTimeout(resolve, remaining))
      setMatches(eligible); setSearched(true); setSearchStep(2)
    } catch (e) { setError((e as Error).message) } finally { setSearching(false); setBusy(false) }
  }

  async function saveClient(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true)
    try { await workspaceUseCases.saveClientProfile(profileForm); setClient(profileForm); setSuccess('Contactos guardados. Agora já pode pesquisar profissionais.'); setRefresh((v)=>v+1) }
    catch(e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  async function saveWorker(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true)
    try {
      const created = await workspaceUseCases.saveWorkerProfile({ profile: workerForm, existing: Boolean(worker) })
      setWorker(created); setWorkerForm({...workerForm,expectedSalary:String(created.expectedSalary)}); setSuccess(worker ? 'Perfil actualizado. A agência irá validar as alterações.' : 'Perfil enviado. A agência irá analisá-lo e atualizar este estado.')
    } catch(e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  async function saveWorkerPhoto(event: FormEvent) {
    event.preventDefault(); setError(''); setSuccess('')
    if (!workerPhotoFile) { setError('Seleccione uma fotografia de perfil.'); return }
    if (workerPhotoFile.size > 3_000_000 || !['image/jpeg','image/png','image/webp'].includes(workerPhotoFile.type)) {
      setError('Escolha uma fotografia JPG, PNG ou WEBP com no máximo 3 MB.'); return
    }
    const form = new FormData()
    form.set('photo', workerPhotoFile)
    setBusy(true)
    try {
      await workspaceUseCases.saveWorkerPhoto(form)
      setWorkerPhotoFile(null)
      setPhotoRevision((value)=>value+1)
      setSuccess('Fotografia do perfil actualizada.')
    } catch(e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  async function submitRequest(housekeeper:Worker) {
    setError(''); setRequestError(null)
    if(taskScope.trim().length<15){setRequestError({workerId:housekeeper.id,message:'Descreva as tarefas desejadas com pelo menos 15 caracteres.'});return}
    if(!monthlySalary||Number(monthlySalary)<5000){setRequestError({workerId:housekeeper.id,message:'Indique um salário mensal proposto a partir de 5.000 MZN.'});return}
    if(!Number.isInteger(Number(monthlySalary))||Number(monthlySalary)%50!==0){setRequestError({workerId:housekeeper.id,message:'O salário proposto deve ser um múltiplo de 50 MT.'});return}
    if(!selectedTaskIds.length){setRequestError({workerId:housekeeper.id,message:'Seleccione pelo menos uma tarefa solicitada.'});return}
    setBusy(true)
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 25000)
    try {
      const [startHour,startMinute]=startTime.split(':').map(Number);const [endHour,endMinute]=endTime.split(':').map(Number);const minutesPerDay=(endHour*60+endMinute)-(startHour*60+startMinute);if(minutesPerDay<=0||minutesPerDay%60!==0){const message='Escolha horários de saída posteriores à entrada e com duração em horas completas.';setError(message);setRequestError({workerId:housekeeper.id,message});return}const hoursPerDay=minutesPerDay/60
      const created=await workspaceUseCases.actions.submitHireRequest({ housekeeperId:housekeeper.id, requiredSkills:selectedSkillCodes, taskIds:selectedTaskIds, requiredDays, city, district, neighborhood:neighborhood.trim(), startTime, endTime, startDate, taskScope:taskScope.trim(), monthlySalary:Number(monthlySalary), durationMonths:Number(durationMonths), hoursPerDay, notes:'' }, controller.signal)
      setRequests(current=>[created,...current.filter(r=>r.id!==created.id)])
      setRefresh((v)=>v+1)
      setSuccess('Pedido enviado. A agência irá acompanhar o processo.')
      setProfilePreview(null)
    } catch(e) { const message=(e as Error).message;setError(message);setRequestError({workerId:housekeeper.id,message}) } finally { window.clearTimeout(timeout);setBusy(false) }
  }

  async function workerRespond(id:string,accepted:boolean){setError('');setBusy(true);try{const result=await workspaceUseCases.actions.respondToHireRequest(id,accepted);if(result.contract)setSuccess(result.contract.aiGenerated?'Aceitou o convite. A minuta do contrato foi criada com IA e aguarda as assinaturas.':'Aceitou o convite. A minuta foi criada e aguarda as assinaturas.');else setSuccess('Convite recusado. A agência foi informada.');setRefresh(v=>v+1)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function submitWorkerProposal(run:()=>Promise<unknown>,successMessage:string){setError('');setSuccess('');setBusy(true);try{await run();setSuccess(successMessage);setRefresh(v=>v+1)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function signContract(id:string,fullName:string,contractRead:boolean){setError('');setBusy(true);try{const result=await workspaceUseCases.actions.signContract(id,{fullName,contractRead});setSuccess(result.clientSigned&&result.workerSigned?'Contrato finalizado e activo: cliente e trabalhadora assinaram.':'Assinatura registada. Falta a outra parte assinar para finalizar o contrato.');setRefresh(v=>v+1)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function confirmWorkStarted(id:string){setError('');const contract=contractsList.find(item=>item.id===id);if(!serverDate){setError('Não foi possível consultar a data oficial do servidor. Actualize a página e tente novamente.');return}if(contract&&contract.hireRequest.startDate>serverDate){setError(`A confirmação só estará disponível a partir de ${formatLocalDate(contract.hireRequest.startDate)}. Data oficial do servidor: ${formatLocalDate(serverDate)}.`);return}setBusy(true);try{const result=await workspaceUseCases.actions.confirmWorkStarted(id);setContractsList(current=>current.map(item=>item.id===id?result:item));if(result.workStarted){if(isWorker){updateRole('HOUSEKEEPER');setSuccess('Início confirmado pelas duas partes. O seu perfil agora é de empregada.')}else setSuccess('Início confirmado pelas duas partes. O perfil da trabalhadora foi actualizado.')}else setSuccess('Confirmação registada. Falta a outra parte confirmar o início.');setRefresh(v=>v+1)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function reviewContract(id:string){setError('');setBusy(true);try{await workspaceUseCases.actions.reviewContract(id,true);setSuccess('Minuta aprovada. As partes já podem assinar.');setRefresh(v=>v+1)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function terminateContract(id:string){const reason=window.prompt('Indique o motivo do encerramento (mínimo 10 caracteres):');if(!reason||reason.trim().length<10)return;setError('');setBusy(true);try{await workspaceUseCases.actions.terminateContract(id,reason.trim());setSuccess('Contrato encerrado. A disponibilidade da trabalhadora foi actualizada.');setRefresh(v=>v+1)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function requestContractChanges(id:string){const note=window.prompt('Explique os ajustes necessários na minuta (mínimo 10 caracteres):')??'';if(note.trim().length<10)return;setError('');setBusy(true);try{await workspaceUseCases.actions.reviewContract(id,false,note);setSuccess('Pedido de alteração enviado às partes.');setRefresh(v=>v+1)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function downloadContract(id:string){setError('');try{await workspaceUseCases.actions.downloadContract(id)}catch(e){setError((e as Error).message)}}
  async function createAgent(event:FormEvent){event.preventDefault();setError('');setNewCredentials(null);if(agentForm.role==='CLIENT'&&!agentForm.photo){setError('Carregue a fotografia do cliente para continuar.');return}setBusy(true);try{const body=new FormData();const {photo,...account}=agentForm;body.append('account',new Blob([JSON.stringify(account)],{type:'application/json'}));if(photo)body.append('photo',photo);const created=await workspaceUseCases.actions.createAgent(body);setNewCredentials(created);setAgentForm({name:'',email:'',role:'SECRETARY',phone:'',address:'',photo:null});setSuccess('Conta criada. A palavra-passe temporária é apresentada uma única vez.')}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function closeIncident(id:string){setError('');setBusy(true);try{await workspaceUseCases.actions.updateIncidentStatus(id,'ENCERRADA','Ocorrência encerrada pela agência.');setRefresh(v=>v+1)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function updateIncidentStatus(id:string,status:string){const decision=window.prompt('Registe uma nota para o histórico desta ocorrência:')??'';setError('');setBusy(true);try{await workspaceUseCases.actions.updateIncidentStatus(id,status,decision);setRefresh(v=>v+1)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function reportIncident(contractId:string,description:string,type='OTHER'){const file=incidentFiles[contractId];setError('');if(!validIncidentFile(file)){setError('Anexe um PDF, JPEG ou PNG até 5 MB.');return}setBusy(true);try{await workspaceUseCases.actions.reportIncident({contractId,description,type,evidence:file});setIncidentFiles({...incidentFiles,[contractId]:null});setSuccess('Ocorrência enviada em confidencialidade à agência.');setRefresh(v=>v+1)}catch(e){setError((e as Error).message);setRefresh(v=>v+1)}finally{setBusy(false)}}
  async function replyIncident(id:string){const message=incidentDrafts[`reply:${id}`]??'';const file=incidentFiles[id];if(message.trim().length<2&&!file)return;setError('');if(!validIncidentFile(file)){setError('Anexe um PDF, JPEG ou PNG até 5 MB.');return}setBusy(true);try{await workspaceUseCases.actions.replyToIncident(id,message,file);setIncidentDrafts({...incidentDrafts,[`reply:${id}`]:''});setIncidentFiles({...incidentFiles,[id]:null});setRefresh(v=>v+1)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}

  async function decideProfile(id:string, status:'APPROVED'|'REJECTED') {
    const reason = status === 'REJECTED' ? window.prompt('Indique o motivo da rejeição (mínimo 10 caracteres):') : null
    if (status === 'REJECTED' && (!reason || reason.trim().length < 10)) return
    setError(''); setBusy(true)
    try { await workspaceUseCases.actions.decideHousekeeper(id,status,reason ?? undefined); setRefresh((v)=>v+1) }
    catch(e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  async function decideRequest(id:string,status:'APPROVED'|'REJECTED') {
    const reason = status === 'REJECTED' ? window.prompt('Indique o motivo da rejeição (mínimo 10 caracteres):') : null
    if (status === 'REJECTED' && (!reason || reason.trim().length < 10)) return
    setError(''); setBusy(true)
    try { await workspaceUseCases.actions.decideHireRequest(id,status,reason ?? undefined); setRefresh((v)=>v+1) }
    catch(e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  if (!session) return null
  if (!allowedPaths.includes(pathname)) return <Navigate to="/" replace />
  return <div className="role-workspace">
    <header className="workspace-heading">
      <div><p className="eyebrow">{isAgent ? 'GESTÃO DA AGÊNCIA' : isSecretary ? 'OPERAÇÕES DA AGÊNCIA' : isClient ? 'A SUA CASA, COM APOIO CERTO' : 'PERFIL PROFISSIONAL'}</p>
        <h1>{isAgent ? (pathname.includes('candidatas') ? 'Rever candidatas' : pathname.includes('agenciamentos') ? 'Pedidos de agenciamento' : pathname.includes('contratos') ? 'Contratos' : pathname.includes('ocorrencias') ? 'Ocorrências confidenciais' : pathname.includes('agentes') ? 'Contas da agência' : 'Painel da agência') : isSecretary ? (pathname.includes('candidatas') ? 'Perfis de candidatas' : pathname.includes('agenciamentos') ? 'Pedidos recebidos' : 'Painel de operações') : isClient ? (pathname.includes('agenciamentos') ? 'Os meus pedidos' : pathname.includes('contratos') ? 'Os meus contratos' : client ? 'Encontre a pessoa certa para a sua casa' : 'Vamos preparar o seu perfil') : pathname.includes('contratos') ? 'Os meus contratos' : worker ? 'O seu perfil profissional' : 'Comece o seu perfil'}</h1>
        <p>{isAgent||isSecretary ? 'Acompanhe os pedidos e perfis da equipa num só lugar.' : isClient ? 'Um passo de cada vez. A agência acompanha o pedido consigo.' : 'A agência analisa o perfil antes de o apresentar a clientes.'}</p>
      </div>
    </header>
    <ErrorMessage value={error} />
    {(isClient||isWorker)&&pathname.includes('contratos')&&<p className="workspace-hint" role="status">{serverDate?`Data oficial consultada no servidor: ${formatLocalDate(serverDate)}.`:'A consultar a data oficial do servidor…'}</p>}
    {success && <div className="workspace-success" role="status">{success}</div>}

    {isSecretary && pathname==='/' && <section className="workspace-card"><div className="workspace-card-heading"><div><h2>Fila de trabalho</h2><p>Veja os perfis e pedidos que a agência está a acompanhar.</p></div></div><div className="workspace-shortcuts"><Link to="/candidatas">{workers.length} perfis de candidatas</Link><Link to="/agenciamentos">{requests.length} pedidos registados</Link></div></section>}
    {isAgent && !pathname.includes('candidatas') && !pathname.includes('agenciamentos') && !pathname.includes('contratos') && !pathname.includes('ocorrencias') && !pathname.includes('agentes') && dashboard && <>
      <section className="workspace-stat-grid">
        {[[dashboard.pendingProfiles,'Perfis por validar'],[dashboard.approvedProfiles,'Perfis aprovados'],[dashboard.pendingRequests,'Pedidos pendentes'],[dashboard.totalClients,'Clientes'],[dashboard.totalContracts,'Contratos'],[dashboard.openIncidents,'Ocorrências abertas']].map(([value,label]) => <article className="workspace-stat" key={String(label)}><span>{label}</span><strong>{value}</strong></article>)}
      </section>
      <section className="workspace-card"><div className="workspace-card-heading"><div><h2>Próximas tarefas</h2><p>Resolva primeiro o que está à espera da equipa.</p></div></div>
        <div className="workspace-shortcuts"><Link to="/candidatas">Rever {dashboard.pendingProfiles} perfis</Link><Link to="/agenciamentos">Acompanhar {dashboard.pendingRequests} pedidos</Link><Link to="/ocorrencias">Ver {dashboard.openIncidents} ocorrências</Link></div>
      </section>
    </>}

    {isAgent && pathname.includes('candidatas') && <section className="workspace-card"><div className="workspace-card-heading"><div><h2>Perfis de trabalhadoras</h2><p>Aprove apenas perfis prontos para aparecer na pesquisa.</p></div></div>
      {workers.length ? <div className="workspace-list">{workers.map(w=><article className="workspace-row" key={w.id}><ProfilePhoto accountId={w.account?.id} name={w.name}/><div className="workspace-row-main"><strong>{w.name}</strong><span>{w.city} · {w.district} · {w.neighborhood} · {w.expectedSalary.toLocaleString('pt-MZ')} MZN</span><small>{(w.skills??[]).map((s)=>SKILLS[s as keyof typeof SKILLS]??s).join(' · ')} | {statusLabel(w.status)}</small></div>{w.status==='PENDING'&&<div className="workspace-actions"><button className="btn btn-primary btn-sm" disabled={busy} onClick={()=>void decideProfile(w.id,'APPROVED')}><Check size={15}/> Aprovar</button><button className="btn btn-ghost btn-sm" disabled={busy} onClick={()=>void decideProfile(w.id,'REJECTED')}><X size={15}/> Rejeitar</button></div>}</article>)}</div>:<p className="workspace-empty">Ainda não há perfis registados.</p>}
    </section>}

    {isSecretary && pathname.includes('candidatas') && <section className="workspace-card"><div className="workspace-card-heading"><div><h2>Perfis registados</h2><p>A sua conta pode consultar os perfis e ajudar no acompanhamento; decisões de aprovação ficam com o gestor.</p></div></div>{workers.length?<div className="workspace-list">{workers.map(w=><article className="workspace-row" key={w.id}><ProfilePhoto accountId={w.account?.id} name={w.name}/><div className="workspace-row-main"><strong>{w.name}</strong><span>{w.city} · {w.district} · {w.neighborhood} · {w.expectedSalary.toLocaleString('pt-MZ')} MZN</span><small>{(w.skills??[]).map(s=>SKILLS[s as keyof typeof SKILLS]??s).join(' · ')} · {statusLabel(w.status)}</small></div></article>)}</div>:<p className="workspace-empty">Ainda não há perfis registados.</p>}</section>}

    {isAgent && pathname.includes('agenciamentos') && <section className="workspace-card"><div className="workspace-card-heading"><div><h2>Pedidos directos</h2><p>Acompanhe a negociação com a candidata. O contrato só entra nesta revisão após ambas as partes concordarem.</p></div></div>
      {requests.length ? <div className="workspace-list">{requests.map((r)=><article className="workspace-row" key={r.id}><div className="worker-avatar"><BriefcaseBusiness size={20}/></div><div className="workspace-row-main"><strong>{r.client?.name ?? 'Cliente'} · {r.housekeeper?.name ?? 'Trabalhadora'}</strong><span>Início: {r.startDate} · {r.monthlySalary?.toLocaleString('pt-MZ')} MZN/mês · {r.durationMonths} meses</span><small>{statusLabel(r.status)} · Escopo: {r.taskScope}{r.rejectionReason?` · ${r.rejectionReason}`:''}</small></div>      {r.status==='PENDING'&&<div className="workspace-actions"><button className="btn btn-ghost btn-sm" disabled={busy} onClick={()=>void decideRequest(r.id,'REJECTED')}>Cancelar pedido</button></div>}</article>)}</div>:<p className="workspace-empty">Ainda não há pedidos.</p>}
    </section>}

    {isSecretary && pathname.includes('agenciamentos') && <section className="workspace-card"><div className="workspace-card-heading"><div><h2>Pedidos da agência</h2><p>Consulta operacional. Apenas o gestor pode aprovar ou rejeitar pedidos.</p></div></div>{requests.length?<div className="workspace-list">{requests.map(r=><article className="workspace-row" key={r.id}><ProfilePhoto accountId={r.client?.id} name={r.client?.name??'Cliente'}/><div className="workspace-row-main"><strong>{r.client?.name??'Cliente'} · {r.housekeeper?.name??'Candidata'}</strong><span>Início: {r.startDate} · {r.monthlySalary?.toLocaleString('pt-MZ')} MZN/mês</span><small>{statusLabel(r.status)} · {r.taskScope}</small></div></article>)}</div>:<p className="workspace-empty">Ainda não há pedidos.</p>}</section>}

    {isAgent && pathname.includes('agentes') && <section className="workspace-card workspace-form-card"><div className="workspace-card-heading"><div><h2>Criar conta pela agência</h2><p>Escolha a função. A senha temporária será mostrada uma vez e alterada no primeiro acesso.</p></div></div><form className="workspace-form" onSubmit={createAgent}><label>Nome completo<input required minLength={4} value={agentForm.name} onChange={e=>setAgentForm({...agentForm,name:e.target.value})}/></label><label>Email<input required type="email" value={agentForm.email} onChange={e=>setAgentForm({...agentForm,email:e.target.value})}/></label><label>Tipo de conta<select value={agentForm.role} onChange={e=>setAgentForm({...agentForm,role:e.target.value})}><option value="SECRETARY">Secretária</option><option value="CLIENT">Cliente</option><option value="AGENT">Gestor</option></select></label>{agentForm.role==='CLIENT'&&<><label>Telemóvel do cliente<input required value={agentForm.phone} onChange={e=>setAgentForm({...agentForm,phone:e.target.value})}/></label><label>Endereço e bairro<input required minLength={5} value={agentForm.address} onChange={e=>setAgentForm({...agentForm,address:e.target.value})}/></label><label className="photo-file-label">Fotografia de perfil (obrigatória)<input required type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setAgentForm({...agentForm,photo:e.target.files?.[0]??null})}/><small>JPG, PNG ou WEBP · até 3 MB</small></label></>}<button className="btn btn-primary" disabled={busy}>{busy?'A criar conta…':'Criar conta e gerar senha'}</button></form>{newCredentials&&<div className="temporary-credentials" role="status"><div><strong>Senha temporária — mostre-a ao utilizador agora</strong><span>{newCredentials.name} · {newCredentials.email} · {newCredentials.role}</span><code>{newCredentials.temporaryPassword}</code><small>Esta senha não voltará a ser mostrada. No primeiro acesso, a pessoa terá de definir uma nova.</small></div><button className="btn btn-soft" onClick={()=>void navigator.clipboard?.writeText(newCredentials.temporaryPassword)}>Copiar senha</button></div>}</section>}

    {isAgent && pathname.includes('contratos') && <section className="workspace-card"><div className="workspace-card-heading"><div><h2>Contratos e revisão</h2><p>Revise os termos, solicite ajustes ou aprove a minuta antes das assinaturas.</p></div></div>{contractsList.length?<div className="workspace-contract-list">{contractsList.map(c=><article className="workspace-contract" key={c.id}><header><strong>{c.hireRequest?.client?.name} · {c.hireRequest?.housekeeper?.name}</strong><span>{contractStatusLabel(c)} · {c.agencyReviewState==='CHANGES_REQUESTED'?'Aguarda alterações':c.agencyReviewed?'Revisão aprovada':'Aguarda revisão'}</span></header>{c.agencyReviewNote&&<p className="workspace-hint">Última nota da agência: {c.agencyReviewNote}</p>}<pre>{c.contractText}</pre><button className="btn btn-soft" onClick={()=>void downloadContract(c.id)}>Descarregar PDF</button><ContractVersionPanel contractId={c.id} currentContent={c.contractText} canEdit/>{c.status==='AWAITING_SIGNATURES'&&!c.agencyReviewed&&<div className="workspace-actions"><button className="btn btn-primary" disabled={busy} onClick={()=>void reviewContract(c.id)}>Aprovar minuta para assinatura</button><button className="btn btn-ghost" disabled={busy} onClick={()=>void requestContractChanges(c.id)}>Solicitar alterações</button></div>}{c.status==='ACTIVE'&&<div className="workspace-actions"><button className="btn btn-ghost" disabled={busy} onClick={()=>void terminateContract(c.id)}>Encerrar contrato</button></div>}</article>)}</div>:<p className="workspace-empty">Ainda não há contratos.</p>}</section>}

    {isAgent && pathname.includes('ocorrencias') && <section className="workspace-card"><div className="workspace-card-heading"><div><h2>Ocorrências confidenciais</h2><p>Analise relatos, peça esclarecimentos e mantenha as decisões no histórico.</p></div></div>{incidents.length?<div className="workspace-list">{incidents.map(i=><article className="workspace-contract" key={i.id}><header><strong>{i.type} · {i.reporter?.name}</strong><span>{new Date(i.createdAt).toLocaleString('pt-MZ')} · {i.status}</span></header><p>{i.contract?.hireRequest?.client?.name} / {i.contract?.hireRequest?.housekeeper?.name}</p><p>{i.description}</p>{i.agencyDecision&&<p className="workspace-hint">Nota da agência: {i.agencyDecision}</p>}<div className="workspace-list">{(incidentMessages[i.id]??[]).map(m=><p key={m.id}><strong>{m.author}</strong> · {m.message} {m.hasAttachment&&<button className="btn btn-ghost btn-sm" onClick={()=>void workspaceUseCases.actions.downloadIncidentAttachment(m.id)}>Abrir anexo</button>} <small>{new Date(m.createdAt).toLocaleString('pt-MZ')}</small></p>)}</div>{!['RESOLVIDA','REJEITADA','ENCERRADA'].includes(i.status)&&<><form className="workspace-actions" onSubmit={e=>{e.preventDefault();void replyIncident(i.id)}}><input aria-label={`Resposta à ocorrência ${i.id}`} value={incidentDrafts[`reply:${i.id}`]??''} onChange={e=>setIncidentDrafts({...incidentDrafts,[`reply:${i.id}`]:e.target.value})} placeholder="Responder ou solicitar esclarecimentos"/><label className="attachment-picker">Anexar documento<input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e=>setIncidentFiles({...incidentFiles,[i.id]:e.target.files?.[0]??null})}/></label><button className="btn btn-soft btn-sm" disabled={busy||(!(incidentDrafts[`reply:${i.id}`]??'').trim()&&!incidentFiles[i.id])}>Enviar resposta</button></form><div className="workspace-actions"><button className="btn btn-soft btn-sm" disabled={busy} onClick={()=>void updateIncidentStatus(i.id,'EM_ANALISE')}>Iniciar análise</button><button className="btn btn-soft btn-sm" disabled={busy} onClick={()=>void updateIncidentStatus(i.id,'AGUARDA_RESPOSTA')}>Pedir esclarecimentos</button><button className="btn btn-primary btn-sm" disabled={busy} onClick={()=>void updateIncidentStatus(i.id,'RESOLVIDA')}>Resolver</button><button className="btn btn-ghost btn-sm" disabled={busy} onClick={()=>void updateIncidentStatus(i.id,'REJEITADA')}>Rejeitar</button><button className="btn btn-ghost btn-sm" disabled={busy} onClick={()=>void closeIncident(i.id)}>Encerrar</button></div></>}</article>)}</div>:<p className="workspace-empty">Nenhuma ocorrência reportada.</p>}</section>}

    {isClient && !client && <section className="workspace-card workspace-form-card"><div className="workspace-card-heading"><div><h2>Os seus dados de contacto</h2><p>Precisamos deles para a agência acompanhar o pedido. Leva menos de um minuto.</p></div></div>
      <form className="workspace-form" onSubmit={saveClient}><label>Telemóvel<input required value={profileForm.phone} placeholder="84 123 4567" onChange={e=>setProfileForm({...profileForm,phone:e.target.value})}/></label><label>Endereço e bairro<input required minLength={5} value={profileForm.address} placeholder="Rua, bairro, cidade" onChange={e=>setProfileForm({...profileForm,address:e.target.value})}/></label><button className="btn btn-primary" disabled={busy}>Guardar e continuar</button></form>
    </section>}

    {isClient && client && pathname.includes('agenciamentos') && <section className="workspace-card"><div className="workspace-card-heading"><div><h2>Estado dos pedidos</h2><p>Os pedidos enviados ficam aqui para consulta.</p></div></div>{requests.length?<div className="workspace-list">{requests.map(r=><article className="workspace-row" key={r.id}><div className="worker-avatar"><BriefcaseBusiness size={20}/></div><div className="workspace-row-main"><strong>{r.housekeeper?.name ?? 'Trabalhadora'}</strong><span>Início: {r.startDate}</span><small>{statusLabel(r.status)}{r.rejectionReason?` · ${r.rejectionReason}`:''}</small>{r.status==='EM_NEGOCIACAO'&&<Link className="btn btn-soft btn-sm" to="/propostas">Ver propostas e decidir</Link>}</div></article>)}</div>:<p className="workspace-empty">Ainda não enviou pedidos. Volte ao início para encontrar uma profissional.</p>}</section>}

    {isClient && pathname.includes('contratos') && <section className="workspace-card"><div className="workspace-card-heading"><div><h2>Minutas e assinaturas</h2><p>Leia o contrato completo e confirme a sua identidade antes de assinar.</p></div></div>{contractsList.length?<div className="workspace-contract-list">{contractsList.map(c=><article className="workspace-contract" key={c.id}><header><strong>{c.hireRequest?.housekeeper?.name} · {contractStatusLabel(c)}</strong><span>{c.aiGenerated?'Minuta redigida com IA':'Minuta automática para revisão'}</span></header><pre>{c.contractText}</pre><button className="btn btn-soft" onClick={()=>void downloadContract(c.id)}>Descarregar PDF</button><ContractVersionPanel contractId={c.id} currentContent={c.contractText}/>{c.agencyReviewed&&!c.clientSigned&&<ContractSignatureForm expectedName={c.hireRequest.client.name} busy={busy} onSign={(fullName,contractRead)=>void signContract(c.id,fullName,contractRead)}/>} {!c.agencyReviewed&&<p className="workspace-hint">{c.agencyReviewState==='CHANGES_REQUESTED'?'A agência solicitou alterações à minuta. A assinatura aparecerá aqui depois da nova revisão.':'Aguardando revisão da agência. Depois da aprovação, o campo para assinar aparecerá aqui.'}</p>}{c.clientSigned&&<p className="workspace-success">Assinado por {c.clientSignatureName??c.hireRequest.client.name}.</p>}<p className="workspace-hint">Assinatura do cliente: {c.clientSigned?'confirmada':'pendente'} · da trabalhadora: {c.workerSigned?'confirmada':'pendente'} · revisão da agência: {c.agencyReviewed?'confirmada':'pendente'}</p>{c.status==='ACTIVE'&&<div className="contract-start"><p className={c.workStarted?'workspace-success':'workspace-hint'}>{workStartStatusLabel(c,true)}</p><button className="btn btn-soft" disabled={busy||c.clientConfirmedStart||c.workStarted} onClick={()=>void confirmWorkStarted(c.id)}>{c.clientConfirmedStart?'Aguardando a outra parte':c.workStarted?'Início confirmado':'Confirmar início do trabalho'}</button></div>}<ContractRatingPanel contractId={c.id}/></article>)}</div>:<p className="workspace-empty">Ainda não há contratos. Quando a proposta salarial for aceite, a minuta ficará disponível aqui.</p>}</section>}

    {isClient && client && !pathname.includes('agenciamentos') && !pathname.includes('contratos') && !pathname.includes('ocorrencias') && <>
      <section className="hiring-journey" aria-label="Passos para contratar uma empregada">
        <div className={`journey-step ${searchStep===1?'active':'complete'}`}><strong>1</strong><span><b>Definir o serviço</b><small>Escolha tarefas e condições</small></span></div>
        <div className={`journey-step ${searchStep===2?'active':''}`}><strong>2</strong><span><b>Escolher candidata</b><small>Veja perfis disponíveis</small></span></div>
        <div className="journey-step"><strong>3</strong><span><b>Negociar</b><small>Se a oferta for inferior ao pretendido</small></span></div>
        <div className="journey-step"><strong>4</strong><span><b>Assinar</b><small>Agência revisa e formaliza</small></span></div>
      </section>
      {searchStep===1&&<form className="workspace-search" onSubmit={search}><label>Província ou cidade<select value={city} onChange={e=>{setCity(e.target.value);setDistrict('')}}>{MOZAMBIQUE_AREAS.map(area=><option key={area} value={area}>{area}</option>)}</select></label><label>Distrito<select required value={district} onChange={e=>setDistrict(e.target.value)}><option value="">Seleccione o distrito</option>{districtsForArea(city).map(d=><option key={d} value={d}>{d}</option>)}</select></label><label>Bairro (opcional)<input value={neighborhood} maxLength={100} placeholder="Escreva o bairro" onChange={e=>setNeighborhood(e.target.value)}/></label><fieldset className="workspace-search-services"><legend>Tarefas necessárias</legend><div className="workspace-options">{taskCatalog.map(t=><label key={t.id}><input type="checkbox" checked={selectedTaskIds.includes(t.id)} onChange={e=>setSelectedTaskIds(e.target.checked?[...selectedTaskIds,t.id]:selectedTaskIds.filter(id=>id!==t.id))}/>{t.name}</label>)}</div><small>Seleccione uma ou várias tarefas do catálogo da agência.</small></fieldset><fieldset className="workspace-search-days"><legend>Dias de trabalho</legend><div className="workspace-options">{Object.entries(WEEKDAYS).map(([day,label])=><label key={day}><input type="checkbox" checked={requiredDays.includes(day)} onChange={e=>setRequiredDays(e.target.checked?[...requiredDays,day]:requiredDays.filter(d=>d!==day))}/>{label}</label>)}</div></fieldset><label>Entrada<input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)}/></label><label>Saída<input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)}/></label><label>Orçamento mensal até (MZN)<CurrencyInput min="0" step="50" value={maxSalary} onChange={setMaxSalary}/><small>0,00 significa sem limite.</small></label>
      <section className="workspace-card workspace-scope"><div className="workspace-card-heading"><div><h2>Defina o que precisa</h2><p>Este escopo será incluído integralmente na minuta do contrato.</p></div></div><label className="scope-description">Tarefas da rotina<textarea rows={4} maxLength={2000} placeholder="Ex.: limpeza da cozinha, quartos e casa de banho; lavagem e passagem de roupa; preparação do almoço. Indique tarefas diárias e semanais." value={taskScope} onChange={e=>setTaskScope(e.target.value)}/><small>{taskScope.length}/2000 caracteres</small></label><div className="scope-details"><label>Salário mensal proposto (MZN)<CurrencyInput min="5000" step="50" value={monthlySalary} onChange={setMonthlySalary}/></label><label>Duração<select value={durationMonths} onChange={e=>setDurationMonths(e.target.value)}>{[1,3,6,12,18,24].map(m=><option key={m} value={m}>{m} meses</option>)}</select></label><label>Data de início<input type="date" min={tomorrow()} value={startDate} onChange={e=>setStartDate(e.target.value)}/></label></div><p className="workspace-hint">Descreva pelo menos 15 caracteres e proponha salário em incrementos de 50 MT. O sistema usa o horário e os dias para verificar compatibilidade.</p><button className="btn btn-primary" type="submit" disabled={busy}><Search size={17}/> {busy?'A procurar…':'Ver candidatas compatíveis'}</button></section></form>}
      {searching ? <section className="workspace-card search-progress" role="status" aria-live="polite"><div className="search-illustration"><span className="search-orbit orbit-one"/><span className="search-orbit orbit-two"/><span className="search-lens"><Search size={34}/></span></div><div className="search-progress-copy"><span className="search-kicker">LARLINK MATCH</span><h2>A procurar empregada para si</h2><p>A cruzar o seu pedido com competências, orçamento, disponibilidade e distância.</p><ol className="search-steps">{['A verificar candidatas num raio de 25 km','A cruzar competências e orçamento','A ordenar os perfis mais próximos e compatíveis'].map((label,index)=><li className={index<=searchStage?'step-active':''} key={label}><span>{index<searchStage?<Check size={13}/>:index+1}</span>{label}</li>)}</ol></div></section> : searchStep===2&&matches.length ? <section className="workspace-card"><div className="workspace-card-heading"><div><h2>Candidatas compatíveis</h2><p>{matches.length} candidata(s) aprovada(s) num raio máximo de 25 km que cumprem as competências, os dias e o orçamento.</p></div><button className="btn btn-soft" onClick={()=>setSearchStep(1)}>Editar pedido</button></div><div className="workspace-match-grid">{matches.map(w=>{const hasPendingRequest=requests.some(r=>r.housekeeper?.id===w.id&&['PENDING','APPROVED','EM_NEGOCIACAO'].includes(r.status));return <article className="workspace-match" key={w.id}><div className="match-score-badge">Compatibilidade <strong>{w.score??0}%</strong></div><ProfilePhoto accountId={w.accountId} name={w.name} size={58}/><h3>{w.name}</h3><p><MapPin size={15}/> {w.district} · {w.neighborhood}, {w.city}</p>{w.distanceKm!=null&&<p><MapPin size={15}/> {w.distanceKm.toLocaleString('pt-MZ',{maximumFractionDigits:1})} km · proximidade {w.proximityScore??0}%</p>}<p>{(w.skills??[]).map(s=>SKILLS[s as keyof typeof SKILLS]??s).join(' · ')}</p><p>{w.yearsOfExperience} anos de experiência · pretende {w.expectedSalary.toLocaleString('pt-MZ')} MZN/mês</p>{w.matchReason&&<p className="match-reason">✦ {w.matchReason}</p>}<button className="btn btn-soft btn-block" onClick={()=>setProfilePreview(w)}>Ver perfil completo</button>{hasPendingRequest?<div className="request-sent-state"><Check size={17}/> <span>Pedido enviado · a aguardar resposta da candidata</span><Link to="/agenciamentos">Acompanhar pedido</Link></div>:<button className="btn btn-primary btn-block" disabled={busy} onClick={()=>void submitRequest(w)}>{busy?'A enviar pedido…':'Enviar pedido à candidata'}</button>}{requestError?.workerId===w.id&&<div className="workspace-error request-inline-error" role="alert">{requestError.message}</div>}</article>})}</div></section> : searchStep===2 ? <section className="workspace-card workspace-empty-state"><ShieldCheck size={30}/><h2>{searched?'Não encontrámos candidatas que cumpram todos os critérios':'A procurar candidatas'}</h2><p>{searched?'Nenhuma candidata aprovada e disponível num raio de 25 km cumpre todos os critérios do pedido. Edite a pesquisa para alterar tarefas, dias, localização ou orçamento.':'Estamos a encontrar perfis disponíveis.'}</p><button className="btn btn-soft" onClick={()=>setSearchStep(1)}>Editar pedido</button></section> : null}
    {profilePreview&&<div className="profile-preview-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setProfilePreview(null)}}><section className="workspace-card profile-preview-modal" role="dialog" aria-modal="true" aria-labelledby="candidate-profile-title"><div className="workspace-card-heading"><div><span className="profile-kicker">Perfil disponível · compatibilidade {profilePreview.score??0}%</span><h2 id="candidate-profile-title">{profilePreview.name}</h2><p><MapPin size={15}/> {profilePreview.district} · {profilePreview.neighborhood}, {profilePreview.city}</p>{profilePreview.distanceKm!=null&&<p>{profilePreview.distanceKm.toLocaleString('pt-MZ',{maximumFractionDigits:1})} km do local do serviço · proximidade {profilePreview.proximityScore??0}%</p>}</div><button className="icon-btn" aria-label="Fechar perfil" onClick={()=>setProfilePreview(null)}>×</button></div><div className="candidate-profile-summary"><ProfilePhoto accountId={profilePreview.accountId} name={profilePreview.name} size={82}/><div><strong>{profilePreview.expectedSalary.toLocaleString('pt-MZ')} MZN/mês</strong><span>Salário pretendido</span></div><div><strong>{profilePreview.yearsOfExperience} anos</strong><span>Experiência</span></div></div><div className="candidate-profile-details"><div><span>Competências</span><p>{(profilePreview.skills??[]).map(s=>SKILLS[s as keyof typeof SKILLS]??s).join(' · ')}</p></div><div><span>Disponibilidade</span><p>{(profilePreview.availability??[]).map(d=>WEEKDAYS[d as keyof typeof WEEKDAYS]??d).join(', ')}</p></div><div><span>Histórico LarLink</span><p>{profilePreview.completedContracts??0} contrato(s) registado(s)</p></div><div><span>Recomendação da agência</span><p>{profilePreview.agencyRecommendation||'Perfil aprovado pela agência'}</p></div></div>{profilePreview.matchReason&&<p className="match-reason">✦ {profilePreview.matchReason}</p>}{profilePreview.canRequest===false&&<p className="match-gap-note">Para enviar pedido, ajuste: {[...(profilePreview.missingSkills??[]).map(s=>SKILLS[s as keyof typeof SKILLS]??s),...(profilePreview.missingAvailability??[]).map(d=>`dia ${WEEKDAYS[d as keyof typeof WEEKDAYS]??d}`)].join(', ')}</p>}{requestError?.workerId===profilePreview.id&&<div className="workspace-error request-inline-error" role="alert">{requestError.message}</div>}<button className="btn btn-primary btn-wide" disabled={busy||requests.some(r=>r.housekeeper?.id===profilePreview.id&&['PENDING','APPROVED','EM_NEGOCIACAO'].includes(r.status))} onClick={()=>void submitRequest(profilePreview)}>{busy?'A enviar pedido…':'Enviar pedido à candidata'}</button></section></div>}
    </>}

    {isClient && client && pathname.includes('ocorrencias') && <section className="workspace-card"><div className="workspace-card-heading"><div><h2>Reportar ocorrência</h2><p>A descrição será enviada apenas à agência, para acompanhamento confidencial.</p></div></div>{contractsList.filter(c=>c.status==='ACTIVE').length?<div className="workspace-list">{contractsList.filter(c=>c.status==='ACTIVE').map(c=><article className="workspace-row" key={c.id}><div className="workspace-row-main"><strong>Contrato com {c.hireRequest?.housekeeper?.name}</strong><textarea rows={3} minLength={10} maxLength={2000} placeholder="Descreva o que aconteceu (mín. 10 caracteres)" value={incidentDrafts[c.id]??''} onChange={e=>setIncidentDrafts({...incidentDrafts,[c.id]:e.target.value})}/><label className="attachment-picker">Anexar comprovativo<input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e=>setIncidentFiles({...incidentFiles,[c.id]:e.target.files?.[0]??null})}/></label><small>PDF, JPEG ou PNG · até 5 MB</small></div><button className="btn btn-primary" disabled={busy||(incidentDrafts[c.id]??'').trim().length<10} onClick={()=>void reportIncident(c.id,incidentDrafts[c.id]??'')}>Enviar à agência</button></article>)}</div>:<p className="workspace-empty">Os reportes ficam disponíveis quando houver um contrato activo.</p>}</section>}

    {isWorker && worker && pathname==='/perfil' && <section className="workspace-card workspace-form-card"><div className="workspace-card-heading"><div><h2>Fotografia do perfil</h2><p>A sua fotografia será apresentada aos clientes quando consultarem o seu perfil.</p></div></div><form className="workspace-form" onSubmit={saveWorkerPhoto}><div className="candidate-profile-summary"><ProfilePhoto key={photoRevision} accountId={worker.accountId??worker.account?.id} name={worker.name} size={82}/><label>Escolher fotografia<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>setWorkerPhotoFile(event.target.files?.[0]??null)}/></label></div><button className="btn btn-primary" disabled={busy||!workerPhotoFile}>Guardar fotografia</button></form></section>}

    {isWorker && (!worker || pathname==='/perfil') && <section className="workspace-card workspace-form-card"><div className="workspace-card-heading"><div><h2>{worker?'Editar perfil profissional':'Conte-nos sobre si'}</h2><p>Partilhe os serviços que oferece, os dias disponíveis e o salário pretendido.</p></div></div>
      <form className="workspace-form" onSubmit={saveWorker}><label>Data de nascimento<input required type="date" value={workerForm.birthDate} onChange={e=>setWorkerForm({...workerForm,birthDate:e.target.value})}/></label><label>Telemóvel<input required value={workerForm.phone} placeholder="84 123 4567" onChange={e=>setWorkerForm({...workerForm,phone:e.target.value})}/></label><label>Província ou cidade<select required value={workerForm.city} onChange={e=>setWorkerForm({...workerForm,city:e.target.value,district:''})}>{MOZAMBIQUE_AREAS.map(area=><option key={area} value={area}>{area}</option>)}</select></label><label>Distrito<select required value={workerForm.district} onChange={e=>setWorkerForm({...workerForm,district:e.target.value})}><option value="">Seleccione o distrito</option>{districtsForArea(workerForm.city).map(d=><option key={d} value={d}>{d}</option>)}</select></label><label>Bairro<input required value={workerForm.neighborhood} placeholder="Escreva o bairro" onChange={e=>setWorkerForm({...workerForm,neighborhood:e.target.value})}/></label><label>Salário pretendido (MZN)<CurrencyInput required min="5000" step="50" value={workerForm.expectedSalary} onChange={value=>setWorkerForm({...workerForm,expectedSalary:value})}/></label><label>Anos de experiência<input required min="0" max="50" type="number" value={workerForm.yearsOfExperience} onChange={e=>setWorkerForm({...workerForm,yearsOfExperience:e.target.value})}/></label>
        <fieldset><legend>Serviços que oferece</legend><div className="workspace-options">{Object.entries(SKILLS).map(([v,l])=><label key={v}><input type="checkbox" checked={workerForm.skills.includes(v)} onChange={e=>setWorkerForm({...workerForm,skills:e.target.checked?[...workerForm.skills,v]:workerForm.skills.filter(x=>x!==v)})}/>{l}</label>)}</div></fieldset>
        <fieldset><legend>Dias disponíveis</legend><div className="workspace-options">{Object.entries(WEEKDAYS).map(([v,l])=><label key={v}><input type="checkbox" checked={workerForm.availability.includes(v)} onChange={e=>setWorkerForm({...workerForm,availability:e.target.checked?[...workerForm.availability,v]:workerForm.availability.filter(x=>x!==v)})}/>{l}</label>)}</div></fieldset>
        <button className="btn btn-primary" disabled={busy}>{worker?'Guardar alterações':'Enviar perfil para análise'}</button>
      </form>
    </section>}

    {isWorker && worker && pathname==='/perfil' && <section className="operations-stack"><div className="workspace-card-heading"><div><h2>Propostas salariais dos pedidos</h2><p>Submeta o salário que pretende para cada oportunidade. O empregador poderá aceitar ou recusar.</p></div></div>{workerProposalRows.filter(({request})=>['PENDING','APPROVED','EM_NEGOCIACAO','WORKER_DECLINED'].includes(request.status)).map(({request,proposals})=><NegotiationCard key={request.id} request={request} proposals={proposals} client={false} worker canRespond accountId={session?.accountId} busy={busy} onAction={(run,message)=>void submitWorkerProposal(run,message)}/>)}{!workerProposalRows.some(({request})=>['PENDING','APPROVED','EM_NEGOCIACAO','WORKER_DECLINED'].includes(request.status))&&<p className="workspace-empty">Ainda não há pedidos disponíveis para negociar.</p>}</section>}

    {isWorker && worker && pathname==='/' && <>
      <section className="workspace-card worker-status-card"><ProfilePhoto accountId={worker.account?.id} name={worker.name} size={64}/><div><span className={`workspace-status status-${worker.status.toLowerCase()}`}>{statusLabel(worker.status)}</span><h2>{worker.name}</h2><p>{worker.district} · {worker.neighborhood}, {worker.city} · {worker.expectedSalary.toLocaleString('pt-MZ')} MZN</p><p>{(worker.skills??[]).map(s=>SKILLS[s as keyof typeof SKILLS]??s).join(' · ')}</p>{worker.rejectionReason&&<p className="workspace-error">{worker.rejectionReason}</p>}</div></section>
      <section className="workspace-card"><div className="workspace-card-heading"><div><h2>Pedidos directos</h2><p>Reveja a oferta do empregador e consulte o seu perfil para submeter a proposta salarial.</p></div></div>{workerRequests.filter(r=>['PENDING','APPROVED','EM_NEGOCIACAO','WORKER_ACCEPTED','WORKER_DECLINED'].includes(r.status)).length?<div className="workspace-list">{workerRequests.filter(r=>['PENDING','APPROVED','EM_NEGOCIACAO','WORKER_ACCEPTED','WORKER_DECLINED'].includes(r.status)).map(r=><article className="workspace-row invite-row" key={r.id}><div className="worker-avatar"><BriefcaseBusiness size={20}/></div><div className="workspace-row-main"><span className={`workspace-status status-${r.status==='PENDING'||r.status==='EM_NEGOCIACAO'?'pending':r.status==='WORKER_ACCEPTED'?'approved':'rejected'}`}>{r.status==='PENDING'?'Pedido directo':r.status==='EM_NEGOCIACAO'?'Proposta salarial':r.status==='WORKER_ACCEPTED'?'Aceite':'Pedido recusado'}</span><strong>Oportunidade de trabalho</strong><span>{r.startDate} · {(r.requiredDays??[]).join(', ')} · {r.startTime}–{r.endTime} · {r.district} · {r.neighborhood} · {r.monthlySalary?.toLocaleString('pt-MZ')} MZN/mês · {r.durationMonths} meses</span><small>Escopo solicitado: {r.taskScope}</small></div>{['PENDING','APPROVED'].includes(r.status)&&<div className="workspace-actions"><button className="btn btn-primary btn-sm" disabled={busy} onClick={()=>void workerRespond(r.id,true)}>Aceitar oferta</button><button className="btn btn-ghost btn-sm" disabled={busy} onClick={()=>void workerRespond(r.id,false)}>Recusar oferta</button></div>}{['PENDING','APPROVED','EM_NEGOCIACAO'].includes(r.status)&&<Link className="btn btn-soft btn-sm" to="/perfil">Ver e submeter proposta salarial</Link>}</article>)}</div>:<p className="workspace-empty">Ainda não há pedidos directos.</p>}</section>
    </>}

    {isWorker && pathname.includes('contratos') && <section className="workspace-card"><div className="workspace-card-heading"><div><h2>Minutas e assinaturas</h2><p>Leia o contrato completo e confirme a sua identidade antes de assinar.</p></div></div>{contractsList.length?<div className="workspace-contract-list">{contractsList.map(c=><article className="workspace-contract" key={c.id}><header><strong>{c.hireRequest?.client?.name} · {contractStatusLabel(c)}</strong><span>{c.aiGenerated?'Minuta redigida com IA':'Minuta automática para revisão'}</span></header><pre>{c.contractText}</pre><button className="btn btn-soft" onClick={()=>void downloadContract(c.id)}>Descarregar PDF</button><ContractVersionPanel contractId={c.id} currentContent={c.contractText}/>{c.agencyReviewed&&!c.workerSigned&&<ContractSignatureForm expectedName={c.hireRequest.housekeeper.name} busy={busy} onSign={(fullName,contractRead)=>void signContract(c.id,fullName,contractRead)}/>} {!c.agencyReviewed&&<p className="workspace-hint">{c.agencyReviewState==='CHANGES_REQUESTED'?'A agência solicitou alterações à minuta. A assinatura aparecerá aqui depois da nova revisão.':'Aguardando revisão da agência. Depois da aprovação, o campo para assinar aparecerá aqui.'}</p>}{c.workerSigned&&<p className="workspace-success">Assinado por {c.workerSignatureName??c.hireRequest.housekeeper.name}.</p>}<p className="workspace-hint">Assinatura do cliente: {c.clientSigned?'confirmada':'pendente'} · da trabalhadora: {c.workerSigned?'confirmada':'pendente'} · revisão da agência: {c.agencyReviewed?'confirmada':'pendente'}</p>{c.status==='ACTIVE'&&<div className="contract-start"><p className={c.workStarted?'workspace-success':'workspace-hint'}>{workStartStatusLabel(c,false)}</p><button className="btn btn-soft" disabled={busy||c.workerConfirmedStart||c.workStarted} onClick={()=>void confirmWorkStarted(c.id)}>{c.workerConfirmedStart?'Aguardando a outra parte':c.workStarted?'Início confirmado':'Confirmar início do trabalho'}</button></div>}{c.workStarted&&<p className="workspace-success">O início foi confirmado pelas duas partes. O seu perfil agora é de empregada.</p>}</article>)}</div>:<p className="workspace-empty">Ainda não há minutas.</p>}</section>}

    {isWorker && worker && pathname.includes('ocorrencias') && <section className="workspace-card"><div className="workspace-card-heading"><div><h2>Reportar ocorrência</h2><p>O relato é encaminhado em confidencialidade apenas à agência.</p></div></div>{contractsList.filter(c=>c.status==='ACTIVE').map(c=><article className="workspace-row" key={c.id}><div className="workspace-row-main"><strong>Contrato com {c.hireRequest?.client?.name}</strong><textarea rows={3} minLength={10} maxLength={2000} placeholder="Descreva o que aconteceu (mín. 10 caracteres)" value={incidentDrafts[c.id]??''} onChange={e=>setIncidentDrafts({...incidentDrafts,[c.id]:e.target.value})}/><label className="attachment-picker">Anexar comprovativo<input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e=>setIncidentFiles({...incidentFiles,[c.id]:e.target.files?.[0]??null})}/></label><small>PDF, JPEG ou PNG · até 5 MB</small></div><button className="btn btn-primary" disabled={busy||(incidentDrafts[c.id]??'').trim().length<10} onClick={()=>void reportIncident(c.id,incidentDrafts[c.id]??'')}>Enviar à agência</button></article>)}</section>}
    {isWorker && pathname.includes('contratos') && <div className="workspace-contract-list">{contractsList.map(c=><ContractRatingPanel key={c.id} contractId={c.id}/>)}</div>}
    {(isClient||isWorker)&&pathname.includes('ocorrencias')&&<section className="workspace-card"><h2>Acompanhamento e respostas</h2>{partyIncidents.length?partyIncidents.map(i=><article className="workspace-contract" key={i.id}><header><strong>{i.type} · {i.status}</strong><span>{new Date(i.createdAt).toLocaleString('pt-MZ')}</span></header><p>{i.description}</p>{i.decision&&<p className="workspace-hint">Decisão da agência: {i.decision}</p>}<div className="workspace-list">{(incidentMessages[i.id]??[]).map(m=><p key={m.id}><strong>{m.author}</strong> · {m.message} {m.hasAttachment&&<button className="btn btn-ghost btn-sm" onClick={()=>void workspaceUseCases.actions.downloadIncidentAttachment(m.id)}>Abrir anexo</button>} <small>{new Date(m.createdAt).toLocaleString('pt-MZ')}</small></p>)}</div>{!['RESOLVIDA','REJEITADA','ENCERRADA'].includes(i.status)&&<form className="workspace-actions" onSubmit={e=>{e.preventDefault();void replyIncident(i.id)}}><input aria-label="Resposta à ocorrência" value={incidentDrafts[`reply:${i.id}`]??''} onChange={e=>setIncidentDrafts({...incidentDrafts,[`reply:${i.id}`]:e.target.value})} placeholder="Responder à agência ou à outra parte"/><label className="attachment-picker">Anexar documento<input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e=>setIncidentFiles({...incidentFiles,[i.id]:e.target.files?.[0]??null})}/></label><button className="btn btn-soft btn-sm" disabled={busy||((incidentDrafts[`reply:${i.id}`]??'').trim().length<2&&!incidentFiles[i.id])}>Enviar resposta</button></form>}</article>):<p className="workspace-empty">Ainda não existem ocorrências registadas.</p>}</section>}
  </div>
}
