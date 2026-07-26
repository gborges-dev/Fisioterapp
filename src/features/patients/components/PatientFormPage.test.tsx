import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ToastProvider } from '../../../components/toast'
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
    useSavePatient: () => ({
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

function formScope() {
  return within(document.body)
}

function renderNewPatientForm() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <Toaster />
        <MemoryRouter initialEntries={['/patients/new']}>
          <Routes>
            <Route path="/patients/new" element={<PatientFormPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
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

  it('mostra o título do novo paciente', () => {
    renderNewPatientForm()
    expect(screen.getByRole('heading', { name: 'Novo paciente' })).toBeInTheDocument()
  })

  it('bloqueia submissão com data de nascimento inválida e mostra aviso', async () => {
    stepValidationOverrides.forceInvalidBirth = true
    const user = userEvent.setup()
    renderNewPatientForm()
    const scope = formScope()

    await user.type(scope.getByRole('textbox', { name: /nome completo/i }), 'Ana Costa')
    await user.click(scope.getByRole('button', { name: 'Guardar paciente' }))

    expect(
      await screen.findByText('Data de nascimento inválida.'),
    ).toBeInTheDocument()
    expect(saveMutateAsync).not.toHaveBeenCalled()
  })

  it('mantém "Guardar paciente" desativado sem nome', async () => {
    renderNewPatientForm()
    const scope = formScope()

    const saveBtn = scope.getByRole('button', { name: 'Guardar paciente' })
    expect(saveBtn).toBeDisabled()
    expect(saveMutateAsync).not.toHaveBeenCalled()
  })

  it('submete após preencher o nome', async () => {
    const user = userEvent.setup()
    renderNewPatientForm()
    const scope = formScope()

    await user.type(scope.getByRole('textbox', { name: /nome completo/i }), 'Ana Costa')
    await user.click(scope.getByRole('button', { name: 'Guardar paciente' }))

    expect(saveMutateAsync).toHaveBeenCalledTimes(1)
    expect(navigateMock).toHaveBeenCalledWith('/patients/new-patient-id')
  })
})
