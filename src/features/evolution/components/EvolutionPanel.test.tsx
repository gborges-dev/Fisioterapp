import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { EvolutionPanel } from './EvolutionPanel'

const { createMutateAsync } = vi.hoisted(() => ({
  createMutateAsync: vi.fn(),
}))

const FORM_ID = '11111111-1111-4111-8111-111111111111'

vi.mock('../hooks/useEvolution', () => ({
  useEvolutionEntries: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  }),
  useCreateEvolution: () => ({
    mutateAsync: createMutateAsync,
    isPending: false,
    error: null,
  }),
  useUpdateEvolutionEntry: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
  }),
  useDeleteEvolutionEntry: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
  }),
}))

vi.mock('../../evaluation-forms/hooks/usePatientEvaluationForms', () => ({
  usePatientEvaluationForms: () => ({
    data: [
      {
        id: '11111111-1111-4111-8111-111111111111',
        title: 'Ficha inicial',
        evaluation_date: '2026-10-01',
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
  }),
}))

vi.mock('@/components/RichTextEditor', () => ({
  RichTextEditor: ({
    label,
    value,
    onChange,
  }: {
    label: string
    value: string
    onChange: (html: string) => void
  }) => (
    <textarea
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

async function selectFicha(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('combobox'))
  await user.click(await screen.findByRole('option', { name: /Ficha inicial/ }))
}

describe('EvolutionPanel', () => {
  beforeAll(() => {
    // Radix Select depende de APIs que o jsdom não implementa.
    Element.prototype.hasPointerCapture = () => false
    Element.prototype.setPointerCapture = () => {}
    Element.prototype.releasePointerCapture = () => {}
    Element.prototype.scrollIntoView = () => {}
  })

  beforeEach(() => {
    createMutateAsync.mockReset()
    createMutateAsync.mockResolvedValue({ id: 'new-entry-id' })
  })

  it('permite registar uma segunda evolução seguida na mesma ficha', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <EvolutionPanel patientId="patient-1" />
      </MemoryRouter>,
    )
    const editor = screen.getByRole('textbox', { name: 'Registo de evolução' })
    const submit = screen.getByRole('button', { name: 'Adicionar registo' })

    await selectFicha(user)
    await user.type(editor, 'Primeira sessão')
    await user.click(submit)
    expect(createMutateAsync).toHaveBeenCalledTimes(1)

    expect(screen.getByRole('combobox')).toHaveTextContent('Ficha inicial')
    await user.type(editor, 'Segunda sessão')
    expect(submit).toBeEnabled()
    await user.click(submit)

    expect(createMutateAsync).toHaveBeenCalledTimes(2)
    expect(createMutateAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({
        content: 'Segunda sessão',
        patientEvaluationFormId: FORM_ID,
      }),
    )
  })
})
