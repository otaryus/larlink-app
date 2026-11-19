import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Portrait } from './Portrait'

describe('Portrait', () => {
  it('renders for any seed (hash must stay non-negative)', () => {
    const seeds = ['hk-ana', 'hk-helena', 'ladino-anselmo', 'hero-larlink', ...Array.from({ length: 200 }, (_, i) => `hk-${i}`)]
    for (const seed of seeds) expect(() => render(<Portrait seed={seed} />).unmount()).not.toThrow()
  })

  it('is deterministic and labelled when a label is given', () => {
    const a = render(<Portrait seed="hk-ana" label="Foto de Ana" />).container.innerHTML
    expect(screen.getByRole('img', { name: 'Foto de Ana' })).toBeInTheDocument()
    const b = render(<Portrait seed="hk-ana" label="Foto de Ana" />).container.innerHTML
    expect(a.replace(/_r_\w+_/g, '')).toBe(b.replace(/_r_\w+_/g, ''))
  })
})
