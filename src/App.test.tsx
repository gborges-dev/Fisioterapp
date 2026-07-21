import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { AuthProvider } from './features/auth/AuthContext'
import { AppRoutes } from './app/AppRoutes'
import { ToastProvider } from './components/toast'
import { ColorModeProvider } from './theme/ColorModeProvider'
import { appTheme } from './theme/appTheme'
const qc = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

function renderWithProviders(ui: ReactElement) {
  return render(
    <QueryClientProvider client={qc}>
      <ColorModeProvider>
        <ThemeProvider theme={appTheme}>
          <ToastProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </ColorModeProvider>
    </QueryClientProvider>,
  )
}

describe('AppRoutes', () => {
  it('redireciona utilizador não autenticado para o login', () => {
    renderWithProviders(<AppRoutes />)
    expect(screen.getByRole('heading', { name: 'Entrar no Fisioterapp' })).toBeInTheDocument()
  })
})
