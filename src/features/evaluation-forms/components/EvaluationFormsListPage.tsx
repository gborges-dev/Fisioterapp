import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState, PageHeader } from '@/components/AppShell'
import { ApiConfigAlert } from '@/components/ApiConfigAlert'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { ListCard } from '@/components/ListCard'
import { ListPageSkeleton } from '@/components/ListPageSkeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toastError, toastSuccess } from '@/components/toast'
import { useSortState, useTableFilterSort } from '@/hooks/useTableFilterSort'
import {
  useEvaluationFormTemplateMutations,
  useEvaluationFormTemplates,
} from '../hooks/useEvaluationFormTemplates'
import type { EvaluationFormTemplateRow } from '../types'

type SortKey = 'title' | 'updated_at'

function compareTemplates(
  a: EvaluationFormTemplateRow,
  b: EvaluationFormTemplateRow,
  orderBy: SortKey,
): number {
  if (orderBy === 'updated_at') {
    return (a.updated_at ?? '').localeCompare(b.updated_at ?? '')
  }
  return (a.title ?? '').toLowerCase().localeCompare((b.title ?? '').toLowerCase(), 'pt')
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function EvaluationFormsListPage() {
  const { data, isLoading, isError, error } = useEvaluationFormTemplates()
  const { remove } = useEvaluationFormTemplateMutations()
  const [filter, setFilter] = useState('')
  const { orderBy, order, handleRequestSort } = useSortState<SortKey>('title')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const getHaystack = useCallback(
    (row: EvaluationFormTemplateRow) =>
      [row.title, row.description ?? '', formatDate(row.updated_at)].join(' '),
    [],
  )

  const compare = useCallback(
    (a: EvaluationFormTemplateRow, b: EvaluationFormTemplateRow, key: string) =>
      compareTemplates(a, b, key as SortKey),
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

  const templateToDelete = useMemo(
    () => (deleteId ? data?.find((t) => t.id === deleteId) : null),
    [deleteId, data],
  )

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await remove.mutateAsync(deleteId)
      toastSuccess('Modelo eliminado.')
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
          { label: 'Fichas de avaliação' },
        ]}
        title="Fichas de avaliação"
        subtitle="Crie modelos de ficha para diferentes áreas de atendimento. Depois vincule uma ficha a cada paciente conforme necessário."
        actions={
          <Button asChild className="lift w-full sm:w-auto">
            <Link to="/evaluation-forms/new">
              <Plus className="h-4 w-4" />
              Novo modelo
            </Link>
          </Button>
        }
      />

      <ApiConfigAlert />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pesquisar modelos…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? <ListPageSkeleton /> : null}
      {isError ? (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      ) : null}
      {!isLoading && !isError && data && data.length === 0 ? (
        <EmptyState title="Nenhum modelo registado." />
      ) : null}
      {!isLoading && !isError && data && data.length > 0 ? (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Ordenar por</span>
            {(
              [
                { key: 'title' as const, label: 'Título' },
                { key: 'updated_at' as const, label: 'Atualização' },
              ] as const
            ).map(({ key, label }) => (
              <Button
                key={key}
                type="button"
                variant={orderBy === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRequestSort(key)}
              >
                {label}
                {orderBy === key ? (order === 'asc' ? ' ↑' : ' ↓') : ''}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredSorted.map((t) => (
              <ListCard
                key={t.id}
                actions={
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary"
                          asChild
                          aria-label="Editar modelo"
                        >
                          <Link to={`/evaluation-forms/${t.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar modelo</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          aria-label="Eliminar modelo"
                          onClick={() => setDeleteId(t.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Eliminar modelo</TooltipContent>
                    </Tooltip>
                  </>
                }
              >
                <h3 className="font-semibold text-foreground">{t.title}</h3>
                {t.description?.trim() ? (
                  <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                ) : null}
                <p className="mt-1 text-sm text-muted-foreground">
                  Atualizado {formatDate(t.updated_at)}
                </p>
              </ListCard>
            ))}
          </div>
        </div>
      ) : null}

      <ConfirmDeleteDialog
        open={Boolean(deleteId)}
        title="Eliminar modelo?"
        message={
          <>
            Esta ação não pode ser anulada. Confirma a eliminação de{' '}
            <strong>{templateToDelete?.title ?? 'este modelo'}</strong>?
          </>
        }
        loading={remove.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
