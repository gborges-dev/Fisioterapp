import { Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { EmptyState, GlassPanel, PageHeader } from '@/components/AppShell'
import { ApiConfigAlert } from '@/components/ApiConfigAlert'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { FilterableSelect } from '@/components/FilterableSelect'
import { ListCard } from '@/components/ListCard'
import { ListPageSkeleton } from '@/components/ListPageSkeleton'
import { usePatients } from '@/features/patients/hooks/usePatients'
import type { PatientRow } from '@/features/patients/services/patientsApi'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  useFinanceEntries,
  useFinanceMutations,
  type NewFinanceEntryInput,
} from '../hooks/useFinance'
import type {
  FinanceEntryType,
  FinanceEntryWithPatient,
} from '../services/financeApi'

function defaultDateRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return {
    from: from.toLocaleDateString('sv-SE'),
    to: to.toLocaleDateString('sv-SE'),
  }
}

function formatMoney(value: number | string) {
  const n = typeof value === 'number' ? value : Number(value)
  return (Number.isFinite(n) ? n : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatDate(iso: string) {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

function toAmountNumber(value: number | string) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

const emptyForm = (): NewFinanceEntryInput => ({
  type: 'entrada',
  amount: 0,
  entryDate: new Date().toLocaleDateString('sv-SE'),
  description: '',
  patientId: null,
})

export function FinancePage() {
  const range = useMemo(() => defaultDateRange(), [])
  const [from, setFrom] = useState(range.from)
  const [to, setTo] = useState(range.to)
  const [patient, setPatient] = useState<PatientRow | null>(null)
  const [typeFilter, setTypeFilter] = useState<FinanceEntryType | ''>('')
  const [filter, setFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FinanceEntryWithPatient | null>(null)
  const [form, setForm] = useState<NewFinanceEntryInput>(emptyForm)
  const [amountText, setAmountText] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<FinanceEntryWithPatient | null>(
    null,
  )

  const { data: patients } = usePatients()
  const { data, isLoading, isError, error } = useFinanceEntries({
    from,
    to,
    patientId: patient?.id ?? null,
    type: typeFilter || null,
  })
  const { create, update, remove } = useFinanceMutations()

  const patientOptions = useMemo(
    () => (patients ?? []).map((p) => ({ value: p, label: p.full_name })),
    [patients],
  )

  const getHaystack = useCallback(
    (row: FinanceEntryWithPatient) =>
      [
        row.description,
        row.patients?.full_name ?? '',
        row.type,
        String(row.amount),
      ].join(' '),
    [],
  )

  const filtered = useMemo(() => {
    if (!data?.length) return []
    const q = filter
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .trim()
    if (!q) return data
    return data.filter((row) =>
      getHaystack(row)
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .includes(q),
    )
  }, [data, filter, getHaystack])

  const totals = useMemo(() => {
    let entradas = 0
    let saidas = 0
    for (const row of filtered) {
      const amount = toAmountNumber(row.amount)
      if (row.type === 'entrada') entradas += amount
      else saidas += amount
    }
    return { entradas, saidas }
  }, [filtered])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setAmountText('')
    setDialogOpen(true)
  }

  const openEdit = (row: FinanceEntryWithPatient) => {
    setEditing(row)
    setForm({
      type: row.type,
      amount: toAmountNumber(row.amount),
      entryDate: row.entry_date.slice(0, 10),
      description: row.description,
      patientId: row.patient_id,
    })
    setAmountText(String(toAmountNumber(row.amount)))
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditing(null)
  }

  const selectedPatient =
    patients?.find((p) => p.id === form.patientId) ?? null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(amountText.replace(',', '.'))
    if (!Number.isFinite(amount) || amount <= 0) return
    if (!form.description.trim()) return

    const payload: NewFinanceEntryInput = {
      ...form,
      amount,
      description: form.description.trim(),
      patientId: form.patientId || null,
    }

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...payload })
      } else {
        await create.mutateAsync(payload)
      }
      closeDialog()
    } catch {
      /* toast no hook */
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await remove.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      /* toast no hook */
    }
  }

  const saving = create.isPending || update.isPending

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Painel', to: '/' },
          { label: 'Financeiro' },
        ]}
        title="Financeiro"
        actions={
          <Button onClick={openCreate}>
            <Plus />
            Novo lançamento
          </Button>
        }
      />

      <ApiConfigAlert />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <GlassPanel className="py-4">
          <p className="text-sm text-muted-foreground">Total de entradas</p>
          <p className="display mt-1 text-2xl font-semibold text-chart-2">
            {formatMoney(totals.entradas)}
          </p>
        </GlassPanel>
        <GlassPanel className="py-4">
          <p className="text-sm text-muted-foreground">Total de saídas</p>
          <p className="display mt-1 text-2xl font-semibold text-destructive">
            {formatMoney(totals.saidas)}
          </p>
        </GlassPanel>
      </div>

      <div className="mb-4 flex flex-col flex-wrap gap-3 md:flex-row">
        <div className="relative min-w-0 flex-1 md:min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar descrição, paciente…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="finance-from">De</Label>
          <Input
            id="finance-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full sm:w-auto"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="finance-to">Até</Label>
          <Input
            id="finance-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full sm:w-auto"
          />
        </div>
        <div className="w-full space-y-1.5 sm:w-40">
          <Label htmlFor="finance-type-filter">Tipo</Label>
          <Select
            value={typeFilter || 'all'}
            onValueChange={(value) =>
              setTypeFilter(value === 'all' ? '' : (value as FinanceEntryType))
            }
          >
            <SelectTrigger id="finance-type-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="entrada">Entradas</SelectItem>
              <SelectItem value="saida">Saídas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <FilterableSelect
          className="w-full sm:w-64"
          label="Paciente"
          placeholder="Todos"
          emptyLabel="Todos"
          options={patientOptions}
          value={patient}
          onChange={setPatient}
          getOptionKey={(p) => p.id}
        />
      </div>

      {isLoading ? <ListPageSkeleton /> : null}
      {isError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      ) : null}
      {!isLoading && !isError && filtered.length === 0 ? (
        <EmptyState title="Nenhum lançamento no período filtrado." />
      ) : null}

      {!isLoading && !isError && filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((row) => (
            <ListCard
              key={row.id}
              actions={
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        aria-label="Editar lançamento"
                        onClick={() => openEdit(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        aria-label="Eliminar lançamento"
                        onClick={() => setDeleteTarget(row)}
                        disabled={remove.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Eliminar</TooltipContent>
                  </Tooltip>
                </>
              }
            >
              <p
                className={cn(
                  'text-xs font-semibold uppercase tracking-wide',
                  row.type === 'entrada' ? 'text-chart-2' : 'text-destructive',
                )}
              >
                {row.type === 'entrada' ? 'Entrada' : 'Saída'}
              </p>
              <p className="display text-xl font-semibold">{formatMoney(row.amount)}</p>
              <p className="mt-1 text-sm">{row.description.trim() || '—'}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatDate(row.entry_date)}
              </p>
              <p className="text-sm text-muted-foreground">
                {row.patients?.full_name ?? 'Sem paciente'}
              </p>
            </ListCard>
          ))}
        </div>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editing ? 'Editar lançamento' : 'Novo lançamento'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="finance-dialog-type">Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm((f) => ({
                      ...f,
                      type: value as FinanceEntryType,
                    }))
                  }
                >
                  <SelectTrigger id="finance-dialog-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="finance-amount">Valor</Label>
                <Input
                  id="finance-amount"
                  required
                  value={amountText}
                  onChange={(e) => setAmountText(e.target.value)}
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="finance-entry-date">Data</Label>
                <Input
                  id="finance-entry-date"
                  type="date"
                  required
                  value={form.entryDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, entryDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="finance-description">Descrição</Label>
                <Textarea
                  id="finance-description"
                  required
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={2}
                />
              </div>
              <FilterableSelect
                label="Paciente (opcional)"
                placeholder="Sem paciente"
                emptyLabel="Sem paciente"
                options={patientOptions}
                value={selectedPatient}
                onChange={(p) =>
                  setForm((f) => ({ ...f, patientId: p?.id ?? null }))
                }
                getOptionKey={(p) => p.id}
              />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={closeDialog} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : null}
                {editing ? 'Guardar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Eliminar lançamento?"
        message={
          <>
            Confirma a eliminação do lançamento de{' '}
            <strong>
              {deleteTarget ? formatMoney(deleteTarget.amount) : ''}
            </strong>
            {deleteTarget?.description
              ? (
                  <>
                    {' '}
                    ({deleteTarget.description})
                  </>
                )
              : null}
            ?
          </>
        }
        loading={remove.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
