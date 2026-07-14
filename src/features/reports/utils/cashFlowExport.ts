import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

import type { FinanceEntryWithPatient } from '../../finance/services/financeApi'
import {
  buildCashFlowCsv,
  formatEntryDate,
  formatMoney,
  summarizeCashFlow,
  toAmountNumber,
} from './cashFlowAggregates'

export type CashFlowExportMeta = {
  fromYmd: string
  toYmd: string
  patientLabel: string
}

function cashFlowFileBase(meta: CashFlowExportMeta): string {
  return `fluxo-de-caixa_${meta.fromYmd}_${meta.toYmd}`
}

export function downloadTextFile(
  fileName: string,
  content: string,
  mimeType = 'text/csv;charset=utf-8',
): void {
  const blob = new Blob([content], { type: mimeType })
  const objectUrl = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = fileName
    a.click()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function exportCashFlowCsv(
  rows: FinanceEntryWithPatient[],
  meta: CashFlowExportMeta,
): void {
  downloadTextFile(`${cashFlowFileBase(meta)}.csv`, buildCashFlowCsv(rows))
}

export function exportCashFlowPdf(
  rows: FinanceEntryWithPatient[],
  meta: CashFlowExportMeta,
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const totals = summarizeCashFlow(rows)
  const fromLabel = formatEntryDate(meta.fromYmd)
  const toLabel = formatEntryDate(meta.toYmd)

  doc.setFontSize(16)
  doc.text('Fluxo de caixa', 14, 18)

  doc.setFontSize(11)
  doc.text(`Período: ${fromLabel} a ${toLabel}`, 14, 28)
  doc.text(`Paciente: ${meta.patientLabel}`, 14, 34)

  doc.text(`Entradas: ${formatMoney(totals.entradas)}`, 14, 44)
  doc.text(`Saídas: ${formatMoney(totals.saidas)}`, 14, 50)
  doc.text(`Saldo líquido: ${formatMoney(totals.saldo)}`, 14, 56)

  autoTable(doc, {
    startY: 64,
    head: [['Data', 'Tipo', 'Valor', 'Descrição', 'Paciente']],
    body: rows.map((row) => [
      formatEntryDate(row.entry_date),
      row.type === 'entrada' ? 'Entrada' : 'Saída',
      formatMoney(toAmountNumber(row.amount)),
      row.description.trim() || '—',
      row.patients?.full_name?.trim() || 'Sem paciente',
    ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [33, 33, 33] },
    columnStyles: {
      2: { halign: 'right' },
    },
  })

  doc.save(`${cashFlowFileBase(meta)}.pdf`)
}
