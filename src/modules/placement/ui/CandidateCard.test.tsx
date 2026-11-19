import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { housekeeperData, NOW } from '../../../test/fixtures'
import { renderWithApp } from '../../../test/render'
import { approveProfile, createHousekeeper } from '../../housekeepers/domain/Housekeeper'
import { CandidateCard } from './CandidateCard'

const housekeeper = approveProfile(createHousekeeper(housekeeperData({ name: 'Ana Carlos' }), 'hk-ana', NOW))

describe('CandidateCard', () => {
  it('shows status, rating, facts, skills and profile link', () => {
    renderWithApp(<CandidateCard card={{ housekeeper, rating: 4.9, reviewCount: 127, availability: 'AVAILABLE' }} favorite={false} onToggleFavorite={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Ana Carlos' })).toBeInTheDocument()
    expect(screen.getByText('Disponível')).toBeInTheDocument()
    expect(screen.getByText('4.9')).toBeInTheDocument()
    expect(screen.getByText('(127 avaliações)')).toBeInTheDocument()
    expect(screen.getByText('5 anos de experiência')).toBeInTheDocument()
    expect(screen.getByText('Maputo')).toBeInTheDocument()
    expect(screen.getByText('Documentação verificada')).toBeInTheDocument()
    expect(screen.getByText('Limpeza')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver perfil/ })).toHaveAttribute('href', '/candidatas/hk-ana')
  })

  it('shows "Em agenciamento" and toggles favourite', async () => {
    const onToggle = vi.fn()
    const { user } = renderWithApp(<CandidateCard card={{ housekeeper, rating: null, reviewCount: 0, availability: 'IN_PLACEMENT' }} favorite onToggleFavorite={onToggle} />)

    expect(screen.getByText('Em agenciamento')).toBeInTheDocument()
    expect(screen.getByText('Sem avaliações')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remover Ana Carlos dos favoritos' }))
    expect(onToggle).toHaveBeenCalledOnce()
  })
})
