import type { FinanceEntryWithPatient } from '../../finance/services/financeApi'

export type CashFlowTotals = {
  entradas: number
  saidas: number
  saldo: number
}

export type CashFlowDailyPoint = {
  date: string
  entradas: number
  saidas: number
}

export function toAmountNumber(amount: number | string): number {
  const n = typeof amount === 'number' ? amount : Number(amount)
  return Number.isFinite(n) ? n : 0
}

export function formatMoney(value: number | string): string {
  const n = toAmountNumber(value)
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function formatEntryDate(ymd: string): string {
  try {
    return new Date(`${ymd}T12:00:00`).toLocaleDateString('pt-BR')
  } catch {
    return ymd
  }
}

export function summarizeCashFlow(
  rows: FinanceEntryWithPatient[],
): CashFlowTotals {
  let entradas = 0
  let saidas = 0
  for (const row of rows) {
    const amount = toAmountNumber(row.amount)
    if (row.type === 'entrada') entradas += amount
    else saidas += amount
  }
  return { entradas, saidas, saldo: entradas - saidas }
}

export function buildDailyCashFlow(
  rows: FinanceEntryWithPatient[],
): CashFlowDailyPoint[] {
  const map = new Map<string, { entradas: number; saidas: number }>()
  for (const row of rows) {
    const date = row.entry_date
    const current = map.get(date) ?? { entradas: 0, saidas: 0 }
    const amount = toAmountNumber(row.amount)
    if (row.type === 'entrada') current.entradas += amount
    else current.saidas += amount
    map.set(date, current)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, totals]) => ({ date, ...totals }))
}

function escapeCsvField(value: string): string {
  if (/[;"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function buildCashFlowCsv(rows: FinanceEntryWithPatient[]): string {
  const header = 'Data;Tipo;Valor;Descrição;Paciente'
  const lines = rows.map((row) => {
    const fields = [
      formatEntryDate(row.entry_date),
      row.type === 'entrada' ? 'Entrada' : 'Saída',
      toAmountNumber(row.amount).toFixed(2),
      row.description.trim(),
      row.patients?.full_name?.trim() ?? '',
    ]
    return fields.map(escapeCsvField).join(';')
  })
  return `\uFEFF${[header, ...lines].join('\n')}`
}
