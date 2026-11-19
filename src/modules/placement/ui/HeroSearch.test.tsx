import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HeroSearch } from './HeroSearch'

describe('HeroSearch', () => {
  it('defaults to Maputo and sends text + city', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<HeroSearch onSearch={onSearch} />)

    expect(screen.getByLabelText('Cidade')).toHaveValue('Maputo')
    await user.type(screen.getByLabelText('O que procura?'), 'babá')
    await user.click(screen.getByRole('button', { name: /Pesquisar/ }))
    expect(onSearch).toHaveBeenCalledWith({ text: 'babá', city: 'Maputo' })
  })

  it('allows searching all cities without text', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<HeroSearch onSearch={onSearch} />)
    await user.selectOptions(screen.getByLabelText('Cidade'), 'Todas as cidades')
    await user.click(screen.getByRole('button', { name: /Pesquisar/ }))
    expect(onSearch).toHaveBeenCalledWith({ text: undefined, city: undefined })
  })
})
