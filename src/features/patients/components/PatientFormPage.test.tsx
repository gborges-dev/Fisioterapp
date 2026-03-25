import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ToastProvider } from '../../../components/toast'
import { appTheme } from '../../../theme/appTheme'
import { PatientFormPage } from './PatientFormPage'

const { navigateMock, saveMutateAsync, stepValidationOverrides } = vi.hoisted(
  () => ({
    navigateMock: vi.fn(),
    saveMutateAsync: vi.fn().mockResolvedValue({ patientId: 'new-patient-id' }),
    stepValidationOverrides: { forceInvalidBirth: false },
  }),
)

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../hooks/usePatientFicha', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../hooks/usePatientFicha')>()
  return {
    ...actual,
    useSavePatientFicha: () => ({
      mutateAsync: saveMutateAsync,
      isPending: false,
      error: null,
    }),
  }
})

vi.mock('../utils/patientStepValidation', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../utils/patientStepValidation')>()
  return {
    ...actual,
    isOptionalBirthDateValid: (value: string) =>
      stepValidationOverrides.forceInvalidBirth
        ? false
        : actual.isOptionalBirthDateValid(value),
  }
})

/** Limita queries ao `Box` que envolve o assistente (pai direto do título). */
function formScope() {
  const heading = screen.getByRole('heading', { name: 'Nova ficha de avaliação' })
  const root = heading.parentElement
  if (!root) throw new Error('contentor do formulário não encontrado')
  return within(root)
}

function renderNewPatientForm() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider theme={appTheme}>
        <ToastProvider>
          <MemoryRouter initialEntries={['/patients/new']}>
            <Routes>
              <Route path="/patients/new" element={<PatientFormPage />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

describe('PatientFormPage', () => {
  beforeEach(() => {
    stepValidationOverrides.forceInvalidBirth = false
    navigateMock.mockClear()
    saveMutateAsync.mockClear()
    saveMutateAsync.mockResolvedValue({ patientId: 'new-patient-id' })
  })

  it('mostra o título da nova ficha', () => {
    renderNewPatientForm()
    expect(
      screen.getByRole('heading', { name: 'Nova ficha de avaliação' }),
    ).toBeInTheDocument()
  })

  it('bloqueia avanço com data de nascimento inválida e mostra aviso', async () => {
    /* O input date no jsdom não propaga strings inválidas ao estado; forçamos o mesmo ramo que `isOptionalBirthDateValid` usa com dados reais inválidos. */
    stepValidationOverrides.forceInvalidBirth = true
    const user = userEvent.setup()
    renderNewPatientForm()
    const scope = formScope()

    await user.click(scope.getByRole('button', { name: 'Seguinte' }))

    expect(
      await screen.findByText('Data de nascimento inválida.'),
    ).toBeInTheDocument()
  })

  it('habilita "Tempo que parou" apenas para ex-fumante', async () => {
    const user = userEvent.setup()
    renderNewPatientForm()
    const scope = formScope()

    await user.click(scope.getByRole('button', { name: 'Seguinte' }))
    await user.click(scope.getByRole('radio', { name: /nunca fumou/i }))
    const quitField = scope.getByRole('textbox', { name: /tempo que parou/i })
    expect(quitField).toBeDisabled()

    await user.click(scope.getByRole('radio', { name: /ex-fumante/i }))
    expect(quitField).not.toBeDisabled()
  })

  it('mantém "Guardar ficha" desativado sem nome no último passo', async () => {
    const user = userEvent.setup()
    renderNewPatientForm()
    const scope = formScope()

    await user.click(scope.getByRole('button', { name: 'Seguinte' }))
    await user.click(scope.getByRole('button', { name: 'Seguinte' }))

    const saveBtn = scope.getByRole('button', { name: 'Guardar ficha' })
    expect(saveBtn).toBeDisabled()
    expect(saveMutateAsync).not.toHaveBeenCalled()
  })

  it('submete após preencher o nome no último passo', async () => {
    const user = userEvent.setup()
    renderNewPatientForm()
    const scope = formScope()

    await user.type(scope.getByRole('textbox', { name: /nome completo/i }), 'Ana Costa')
    await user.click(scope.getByRole('button', { name: 'Seguinte' }))
    await user.click(scope.getByRole('button', { name: 'Seguinte' }))

    await user.click(scope.getByRole('button', { name: 'Guardar ficha' }))

    expect(saveMutateAsync).toHaveBeenCalledTimes(1)
    expect(navigateMock).toHaveBeenCalledWith('/patients/new-patient-id')
  })
})
