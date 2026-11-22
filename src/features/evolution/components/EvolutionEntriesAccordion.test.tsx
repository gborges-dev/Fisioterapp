import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '@/components/ui/tooltip'
import type { EvolutionRow } from '../services/evolutionApi'
import { EvolutionEntriesAccordion, formatEvolutionDate } from './EvolutionEntriesAccordion'

const longText = 'Paciente refere melhoria. '.repeat(10).trim()
const row = {
  id: 'e1',
  patient_evaluation_form_id: 'f1',
  entry_date: '2026-11-20',
  content: `<p><strong>Dor</strong> lombar</p><p>${longText}</p>`,
} as EvolutionRow

class FakeClipboardItem {
  constructor(public items: Record<string, Blob>) {}
}

function renderAccordion(onExpandedChange = vi.fn()) {
  render(
    <TooltipProvider>
      <EvolutionEntriesAccordion
        entries={[row]}
        formTitleById={new Map([['f1', 'Ficha inicial']])}
        isLoading={false}
        isError={false}
        error={null}
        expandedId={false}
        editingId={null}
        onExpandedChange={onExpandedChange}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    </TooltipProvider>,
  )
  return onExpandedChange
}

const copyLabel = `Copiar texto do registo de ${formatEvolutionDate(row.entry_date)}`

describe('EvolutionEntriesAccordion — copiar', () => {
  const write = vi.fn()
  const writeText = vi.fn()

  beforeEach(() => {
    write.mockReset().mockResolvedValue(undefined)
    writeText.mockReset().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { write, writeText },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('copia HTML e texto completo com ClipboardItem, sem expandir o registo', async () => {
    vi.stubGlobal('ClipboardItem', FakeClipboardItem)
    const onExpandedChange = renderAccordion()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: copyLabel }))
    })

    expect(write).toHaveBeenCalledTimes(1)
    const item = write.mock.calls[0][0][0] as FakeClipboardItem
    expect(await item.items['text/html'].text()).toBe(row.content)
    expect(await item.items['text/plain'].text()).toBe(`Dor lombar\n${longText}`)
    expect(writeText).not.toHaveBeenCalled()
    expect(onExpandedChange).not.toHaveBeenCalled()
  })

  it('usa writeText quando ClipboardItem não existe e mostra Check por ~2s', async () => {
    vi.stubGlobal('ClipboardItem', undefined)
    vi.useFakeTimers()
    renderAccordion()
    const button = screen.getByRole('button', { name: copyLabel })

    await act(async () => {
      fireEvent.click(button)
    })

    expect(writeText).toHaveBeenCalledWith(`Dor lombar\n${longText}`)
    expect(button.querySelector('.lucide-check')).not.toBeNull()

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(button.querySelector('.lucide-copy')).not.toBeNull()
  })

  it('não mostra Check quando a cópia falha', async () => {
    vi.stubGlobal('ClipboardItem', undefined)
    writeText.mockRejectedValue(new Error('denied'))
    renderAccordion()
    const button = screen.getByRole('button', { name: copyLabel })

    await act(async () => {
      fireEvent.click(button)
    })

    expect(button.querySelector('.lucide-check')).toBeNull()
  })
})

describe('EvolutionEntriesAccordion — estrutura do cabeçalho', () => {
  it('não aninha botões e mantém as ações fora do trigger', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onExpandedChange = renderAccordion()

    expect(document.querySelector('button button')).toBeNull()
    const nestingWarnings = errorSpy.mock.calls.filter((args) =>
      args.some((a) => typeof a === 'string' && a.includes('descendant of')),
    )
    expect(nestingWarnings).toEqual([])
    errorSpy.mockRestore()

    const trigger = document.querySelector('[data-radix-collection-item]') as HTMLElement
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.textContent).not.toMatch(/Copiar|Editar|Eliminar/)
    expect(trigger.contains(screen.getByRole('button', { name: copyLabel }))).toBe(false)

    fireEvent.click(
      screen.getByRole('button', {
        name: `Editar registo de ${formatEvolutionDate(row.entry_date)}`,
      }),
    )
    expect(onExpandedChange).not.toHaveBeenCalled()

    fireEvent.click(trigger)
    expect(onExpandedChange).toHaveBeenCalledWith('e1')
  })
})
