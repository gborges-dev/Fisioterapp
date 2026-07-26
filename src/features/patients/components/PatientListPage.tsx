import {
  ClipboardList,
  LineChart,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState, PageHeader } from '@/components/AppShell'
import { ApiConfigAlert } from '@/components/ApiConfigAlert'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { ListCard } from '@/components/ListCard'
import { ListPageSkeleton } from '@/components/ListPageSkeleton'
import { toastError, toastSuccess } from '@/components/toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
      toastSuccess('Paciente eliminado.')
      setDeleteId(null)
    } catch (err) {
      toastError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return (
    <div>
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

      <div className="relative mb-4 max-w-[480px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome, email ou telefone…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? <ListPageSkeleton /> : null}
      {isError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      ) : null}
      {data && data.length === 0 ? (
        <EmptyState
          title="Nenhum paciente registado"
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
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="w-full text-sm text-muted-foreground sm:w-auto">
              Ordenar por
            </span>
            {(
              [
                { key: 'full_name' as const, label: 'Nome' },
                { key: 'email' as const, label: 'Email' },
                { key: 'phone' as const, label: 'Telefone' },
              ] as const
            ).map(({ key, label }) => (
              <Badge
                key={key}
                variant={orderBy === key ? 'default' : 'outline'}
                className={cn('cursor-pointer select-none')}
                onClick={() => handleRequestSort(key)}
              >
                {`${label}${orderBy === key ? (order === 'asc' ? ' ↑' : ' ↓') : ''}`}
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredSorted.map((p) => (
              <ListCard
                key={p.id}
                actions={
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <Link
                            to={patientTabPath(p.id, 'fichas')}
                            aria-label="Fichas de avaliação"
                          >
                            <ClipboardList className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Fichas de avaliação</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <Link
                            to={patientTabPath(p.id, 'evolucao')}
                            aria-label="Evolução"
                          >
                            <LineChart className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Evolução</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <Link
                            to={`/patients/${p.id}/edit`}
                            aria-label="Editar paciente"
                          >
                            <Pencil className="h-4 w-4" />
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
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          aria-label="Eliminar paciente"
                          onClick={() => setDeleteId(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Eliminar paciente</TooltipContent>
                    </Tooltip>
                  </>
                }
              >
                <Link
                  to={`/patients/${p.id}`}
                  className="font-semibold text-foreground no-underline hover:text-primary"
                >
                  {p.full_name}
                </Link>
                <p className="mt-2 text-sm text-muted-foreground">
                  {p.email?.trim() || 'Sem email'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {p.phone?.trim() || 'Sem telefone'}
                </p>
              </ListCard>
            ))}
          </div>
        </div>
      ) : null}

      <ConfirmDeleteDialog
        open={Boolean(deleteId)}
        title="Eliminar paciente?"
        message={
          <>
            Esta ação não pode ser anulada. Confirma a eliminação de{' '}
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
