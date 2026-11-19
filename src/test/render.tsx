import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { ContainerProvider } from '../shared/ui/ContainerContext'
import { createTestContainer } from './fixtures'

export function renderWithApp(ui: ReactElement, { container = createTestContainer(), route = '/' } = {}) {
  const user = userEvent.setup()
  const result = render(
    <ContainerProvider container={container}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </ContainerProvider>,
  )
  return { ...result, user, container }
}
