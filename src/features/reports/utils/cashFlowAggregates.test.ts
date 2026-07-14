import { describe, expect, it } from 'vitest'

import type { FinanceEntryWithPatient } from '../../finance/services/financeApi'
import {
  buildCashFlowCsv,
  buildDailyCashFlow,
  summarizeCashFlow,
  toAmountNumber,
} from './cashFlowAggregates'

function entry(
  partial: Partial<FinanceEntryWithPatient> &
    Pick<FinanceEntryWithPatient, 'type' | 'amount' | 'entry_date'>,
): FinanceEntryWithPatient {
  return {
    id: partial.id ?? crypto.randomUUID(),
    workspace_id: partial.workspace_id ?? 'ws',
    patient_id: partial.patient_id ?? null,
    description: partial.description ?? '',
    created_at: partial.created_at ?? '2026-01-01T00:00:00Z',
    patients: partial.patients ?? null,
    type: partial.type,
    amount: partial.amount,
    entry_date: partial.entry_date,
  }
}

describe('cashFlowAggregates', () => {
  it('summarizeCashFlow totals entradas, saidas and saldo', () => {
    const totals = summarizeCashFlow([
      entry({ type: 'entrada', amount: 100, entry_date: '2026-07-01' }),
      entry({ type: 'entrada', amount: '50.5', entry_date: '2026-07-02' }),
      entry({ type: 'saida', amount: 30, entry_date: '2026-07-01' }),
    ])
    expect(totals.entradas).toBe(150.5)
    expect(totals.saidas).toBe(30)
    expect(totals.saldo).toBe(120.5)
  })

  it('buildDailyCashFlow groups by date ascending', () => {
    const daily = buildDailyCashFlow([
      entry({ type: 'saida', amount: 10, entry_date: '2026-07-03' }),
      entry({ type: 'entrada', amount: 20, entry_date: '2026-07-01' }),
      entry({ type: 'entrada', amount: 5, entry_date: '2026-07-03' }),
    ])
    expect(daily).toEqual([
      { date: '2026-07-01', entradas: 20, saidas: 0 },
      { date: '2026-07-03', entradas: 5, saidas: 10 },
    ])
  })

  it('buildCashFlowCsv includes BOM, header and escaped fields', () => {
    const csv = buildCashFlowCsv([
      entry({
        type: 'entrada',
        amount: 12.5,
        entry_date: '2026-07-01',
        description: 'Sessão; extra',
        patients: { full_name: 'Ana' },
      }),
    ])
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('Data;Tipo;Valor;Descrição;Paciente')
    expect(csv).toContain('Entrada')
    expect(csv).toContain('12.50')
    expect(csv).toContain('"Sessão; extra"')
    expect(csv).toContain('Ana')
  })

  it('toAmountNumber handles invalid values', () => {
    expect(toAmountNumber('abc')).toBe(0)
    expect(toAmountNumber(15)).toBe(15)
  })
})
