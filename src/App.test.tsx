import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { AppRoutes } from './app/AppRoutes'

const theme = createTheme()
const qc = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

function renderWithProviders(ui: ReactElement) {
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

describe('AppRoutes', () => {
  it('renderiza o painel na rota inicial', () => {
    renderWithProviders(<AppRoutes />)
    expect(screen.getByRole('heading', { name: 'Painel' })).toBeInTheDocument()
  })
})
