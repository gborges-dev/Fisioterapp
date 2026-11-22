import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState, PageHeader } from '@/components/AppShell'
import { ApiConfigAlert } from '@/components/ApiConfigAlert'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { ListPageSkeleton } from '@/components/ListPageSkeleton'
import { toastError, toastSuccess } from '@/components/toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useSortState, useTableFilterSort } from '@/hooks/useTableFilterSort'
import { usePatientMutations, usePatients } from '../hooks/usePatients'
import { patientTabPath } from '../patientTabs'
import type { PatientRow } from '../services/patientsApi'
import { patientInitials } from '../utils/initials'

type SortKey = 'full_name' | 'email' | 'phone'

function comparePatients(a: PatientRow, b: PatientRow, orderBy: SortKey): number {
  const va = (a[orderBy] ?? '').toString().toLowerCase()
  const vb = (b[orderBy] ?? '').toString().toLowerCase()
  return va.localeCompare(vb, 'pt')
}

export function PatientListPage() {
  const { data, isLoading, isError, error } = usePatients()
  const { remove } = usePatientMutations()
  const [filter, setFilter] = useState('')
  const { orderBy, order, handleRequestSort } = useSortState<SortKey>('full_name')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const getHaystack = useCallback(
    (p: PatientRow) =>
      [p.full_name, p.email ?? '', p.phone ?? ''].join(' '),
    [],
  )

  const compare = useCallback(
    (a: PatientRow, b: PatientRow, key: keyof PatientRow | string) =>
      comparePatients(a, b, key as SortKey),
    [],
  )

  const filteredSorted = useTableFilterSort({
    rows: data ?? undefined,
    filterText: filter,
    getFilterHaystack: getHaystack,
    orderBy,
    order,
    compare,
  })

  const patientToDelete = useMemo(
    () => (deleteId ? data?.find((p) => p.id === deleteId) : null),
    [deleteId, data],
  )

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await remove.mutateAsync(deleteId)
      toastSuccess('Paciente excluído.')
      setDeleteId(null)
    } catch (err) {
      toastError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  const count = data?.length ?? 0

  return (
    <div>
      {data ? (
        <p className="mb-1 text-sm text-muted-foreground">
          {count} {count === 1 ? 'paciente cadastrado' : 'pacientes cadastrados'}
        </p>
      ) : null}
      <PageHeader
        breadcrumbs={[
          { label: 'Painel', to: '/' },
          { label: 'Pacientes' },
        ]}
        title="Pacientes"
        actions={
          <Button asChild>
            <Link to="/patients/new">
              <Plus className="h-4 w-4" />
              Novo paciente
            </Link>
          </Button>
        }
      />

      <ApiConfigAlert />

      <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="relative min-w-[260px] max-w-[520px] flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            aria-label="Pesquisar pacientes"
            type="search"
            placeholder="Pesquisar por nome, e-mail ou telefone"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Ordenar por</span>
          {(
            [
              { key: 'full_name' as const, label: 'Nome' },
              { key: 'email' as const, label: 'E-mail' },
              { key: 'phone' as const, label: 'Telefone' },
            ] as const
          ).map(({ key, label }) => {
            const active = orderBy === key
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => handleRequestSort(key)}
                className={cn(
                  'min-h-11 rounded-full border px-4 text-sm transition-colors',
                  active
                    ? 'border-primary bg-accent font-semibold text-accent-foreground'
                    : 'border-input bg-card font-medium text-foreground/80 hover:bg-muted',
                )}
              >
                {`${label}${active ? (order === 'asc' ? ' ↑' : ' ↓') : ''}`}
              </button>
            )
          })}
        </div>
      </div>

      {isLoading ? <ListPageSkeleton count={4} cardHeight={72} /> : null}
      {isError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      ) : null}
      {data && data.length === 0 ? (
        <EmptyState
          title="Nenhum paciente cadastrado"
          action={
            <Button asChild>
              <Link to="/patients/new">
                <Plus className="h-4 w-4" />
                Novo paciente
              </Link>
            </Button>
          }
        />
      ) : null}
      {data && data.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <ul>
            {filteredSorted.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border px-5 py-3.5 last:border-b-0"
              >
                <Link
                  to={`/patients/${p.id}`}
                  className="flex min-w-[240px] flex-[2_1_240px] items-center gap-3.5 text-foreground no-underline hover:text-primary"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-accent-foreground"
                    aria-hidden
                  >
                    {patientInitials(p.full_name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p.full_name}</span>
                    {p.consultation_reason?.trim() ? (
                      <span className="block truncate text-[13px] font-normal text-muted-foreground">
                        {p.consultation_reason.trim()}
                      </span>
                    ) : null}
                  </span>
                </Link>
                <div className="min-w-0 flex-[2_1_200px] text-sm">
                  <span className="block">{p.phone?.trim() || 'Sem telefone'}</span>
                  <span className="block truncate text-muted-foreground">
                    {p.email?.trim() || 'Sem e-mail'}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="outline" asChild>
                    <Link to={patientTabPath(p.id, 'evolucao')}>Evolução</Link>
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          to={`/patients/${p.id}/edit`}
                          aria-label={`Editar ${p.full_name}`}
                        >
                          <Pencil className="h-[18px] w-[18px]" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar paciente</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Excluir ${p.full_name}`}
                        onClick={() => setDeleteId(p.id)}
                      >
                        <Trash2 className="h-[18px] w-[18px]" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Excluir paciente</TooltipContent>
                  </Tooltip>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ConfirmDeleteDialog
        open={Boolean(deleteId)}
        title="Excluir paciente?"
        message={
          <>
            Esta ação não pode ser desfeita. Confirma a exclusão de{' '}
            <strong>{patientToDelete?.full_name ?? 'este paciente'}</strong>?
          </>
        }
        loading={remove.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
