import type { ReactNode } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { appTheme } from '../../theme/appTheme'
import { ToastProvider } from './ToastProvider'
import { useToast } from './useToast'

function Demo() {
  const { showSuccess, showError } = useToast()
  return (
    <div>
      <button type="button" onClick={() => showSuccess('Operação concluída.')}>
        Sucesso
      </button>
      <button type="button" onClick={() => showError('Falhou.')}>
        Erro string
      </button>
      <button
        type="button"
        onClick={() => showError(new Error('Falhou com Error'))}
      >
        Erro Error
      </button>
    </div>
  )
}

function renderWithTheme(ui: ReactNode) {
  return render(
    <ThemeProvider theme={appTheme}>
      <ToastProvider>{ui}</ToastProvider>
    </ThemeProvider>,
  )
}

describe('ToastProvider', () => {
  it('mostra mensagem de sucesso', async () => {
    const user = userEvent.setup()
    renderWithTheme(<Demo />)
    await user.click(screen.getByRole('button', { name: 'Sucesso' }))
    expect(await screen.findByText('Operação concluída.')).toBeInTheDocument()
  })

  it('mostra mensagem de erro a partir de string ou Error', async () => {
    const user = userEvent.setup()
    renderWithTheme(<Demo />)
    await user.click(screen.getByRole('button', { name: 'Erro string' }))
    expect(await screen.findByText('Falhou.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Erro Error' }))
    expect(await screen.findByText('Falhou com Error')).toBeInTheDocument()
  })
})
