import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Route, Routes, MemoryRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

import { AuthProvider } from '../features/auth/AuthContext'
import { ToastProvider } from './toast'
import { ColorModeProvider } from '../theme/ColorModeProvider'
import { AppShell } from './AppShell'
import { TooltipProvider } from './ui/tooltip'

describe('AppShell', () => {
  it('mostra o nome da app e links de navegação', () => {
    render(
      <ColorModeProvider>
        <TooltipProvider>
          <ToastProvider>
            <Toaster />
            <MemoryRouter initialEntries={['/']}>
              <AuthProvider>
                <Routes>
                  <Route element={<AppShell />}>
                    <Route path="/" element={<div>Conteúdo</div>} />
                  </Route>
                </Routes>
              </AuthProvider>
            </MemoryRouter>
          </ToastProvider>
        </TooltipProvider>
      </ColorModeProvider>,
    )
    expect(screen.getAllByText('Fisioterapp').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('link', { name: 'Painel' }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('link', { name: 'Pacientes' }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('link', { name: 'Formulários' }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('link', { name: 'Relatórios' }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Conteúdo')).toBeInTheDocument()
  })
})
