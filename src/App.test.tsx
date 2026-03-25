import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { AppRoutes } from './app/AppRoutes'
import { ToastProvider } from './components/toast'
import { appTheme } from './theme/appTheme'
const qc = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

function renderWithProviders(ui: ReactElement) {
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider theme={appTheme}>
        <ToastProvider>
          <MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>
        </ToastProvider>
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
