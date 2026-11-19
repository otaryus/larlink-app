import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NegotiationCard } from './NegotiationCard'

describe('NegotiationCard',()=>{
  it('shows complete contract terms before the client price negotiation option',()=>{
    render(<NegotiationCard client worker={false} canRespond accountId="client" busy={false} onAction={vi.fn()} proposals={[]} request={{id:'r1',status:'PENDING',monthlySalary:8000,taskScope:'Limpeza profunda',selectedTaskNames:'Limpeza geral',durationMonths:6,hoursPerDay:8,startDate:'2026-12-01',startTime:'08:00',endTime:'16:00',district:'KaMpfumu',neighborhood:'Polana',requiredSkills:['CLEANING'],requiredDays:['MON','FRI'],notes:'Casa com animais',expiresAt:'2026-12-10T10:00:00Z',client:{id:'client',name:'Cliente'},housekeeper:{id:'worker',name:'Amélia',expectedSalary:9000}}}/>)

    expect(screen.getByText('Limpeza geral')).toBeInTheDocument()
    expect(screen.getByText(/KaMpfumu/)).toBeInTheDocument()
    expect(screen.getByText(/08:00–16:00/)).toBeInTheDocument()
    expect(screen.getByText(/6 mês/)).toBeInTheDocument()
    expect(screen.getByText(/Segunda, Sexta/)).toBeInTheDocument()
    expect(screen.getByText(/Casa com animais/)).toBeInTheDocument()
    expect(screen.getByRole('heading',{name:'Negociar o preço'})).toBeInTheDocument()
    expect(screen.getByRole('button',{name:/Submeter proposta/})).toBeInTheDocument()
  })

  it('lets the worker submit a salary proposal from the request profile',()=>{
    render(<NegotiationCard worker client={false} canRespond accountId="worker-account" busy={false} onAction={vi.fn()} proposals={[]} request={{id:'r2',status:'EM_NEGOCIACAO',monthlySalary:8000,taskScope:'Limpeza completa',durationMonths:6,hoursPerDay:8,startDate:'2026-12-01',client:{id:'client',name:'Empregador'},housekeeper:{id:'worker',name:'Amélia',expectedSalary:9000}}}/>)

    expect(screen.getByRole('heading',{name:'Apresentar a sua proposta salarial'})).toBeInTheDocument()
    expect(screen.getByLabelText('A sua proposta salarial mensal (MT)')).toHaveAttribute('min','8000')
    expect(screen.getByRole('button',{name:/Submeter proposta/})).toBeEnabled()
  })

  it('shows employer accept and reject actions for the worker proposal',()=>{
    const onAction=vi.fn()
    render(<NegotiationCard client worker={false} canRespond accountId="client" busy={false} onAction={onAction} proposals={[{id:'p1',authorId:'worker-account',authorName:'Amélia',monthlySalary:9000,status:'OPEN',createdAt:'2026-11-19T10:00:00Z'}]} request={{id:'r3',status:'EM_NEGOCIACAO',monthlySalary:8000,taskScope:'Limpeza completa',durationMonths:6,hoursPerDay:8,startDate:'2026-12-01',client:{id:'client',name:'Empregador'},housekeeper:{id:'worker',name:'Amélia',expectedSalary:9000}}}/>)

    expect(screen.getByRole('button',{name:'Confirmar e aceitar proposta'})).toBeInTheDocument()
    expect(screen.getByRole('button',{name:'Recusar proposta'})).toBeInTheDocument()
  })
})
