import { ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Route, Routes, MemoryRouter } from 'react-router-dom'

import { ToastProvider } from './toast'
import { ColorModeProvider } from '../theme/ColorModeProvider'
import { appTheme } from '../theme/appTheme'
import { AppLayout } from './AppLayout'

describe('AppLayout', () => {
  it('mostra o nome da app e links de navegação', () => {
    render(
      <ColorModeProvider>
        <ThemeProvider theme={appTheme}>
          <ToastProvider>
            <MemoryRouter initialEntries={['/']}>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<div>Conteúdo</div>} />
                </Route>
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </ThemeProvider>
      </ColorModeProvider>,
    )
    expect(screen.getAllByText('Fisioterapp').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('link', { name: 'Painel' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pacientes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Formulários' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Relatórios' })).toBeInTheDocument()
    expect(screen.getByText('Conteúdo')).toBeInTheDocument()
  })
})
