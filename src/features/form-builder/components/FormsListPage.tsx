import {
  Eye,
  Link as LinkIcon,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState, GlassPanel, PageHeader } from '@/components/AppShell'
import { ApiConfigAlert } from '@/components/ApiConfigAlert'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { ListCard } from '@/components/ListCard'
import { ListPageSkeleton } from '@/components/ListPageSkeleton'
import { useToast } from '@/components/toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSortState, useTableFilterSort } from '@/hooks/useTableFilterSort'
import type { FormFieldType } from '@/types/database.types'
import { useFormTemplateMutations, useFormTemplates } from '../hooks/useFormTemplates'
import { parseFormSchema } from '../services/formsApi'
import type { FormTemplateRow } from '../types'

function fieldTypeLabel(type: FormFieldType): string {
  const m: Record<FormFieldType, string> = {
    text: 'Texto curto',
    textarea: 'Texto longo',
    number: 'Número',
    date: 'Data',
    select: 'Lista de opções',
    multiselect: 'Múltipla escolha',
  }
  return m[type] ?? type
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

type SortKey = 'title' | 'updated_at'

function compareForms(a: FormTemplateRow, b: FormTemplateRow, orderBy: SortKey): number {
  if (orderBy === 'updated_at') {
    return (a.updated_at ?? '').localeCompare(b.updated_at ?? '')
  }
  return (a.title ?? '').toLowerCase().localeCompare((b.title ?? '').toLowerCase(), 'pt')
}

export function FormsListPage() {
  const { data, isLoading, isError, error } = useFormTemplates()
  const { createLink, remove } = useFormTemplateMutations()
  const { showSuccess, showError } = useToast()
  const [filter, setFilter] = useState('')
  const { orderBy, order, handleRequestSort } = useSortState<SortKey>('title')
  const [previewRow, setPreviewRow] = useState<FormTemplateRow | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const getHaystack = useCallback(
    (row: FormTemplateRow) =>
      [row.title, formatDate(row.updated_at)].join(' '),
    [],
  )

  const compare = useCallback(
    (a: FormTemplateRow, b: FormTemplateRow, key: string) =>
      compareForms(a, b, key as SortKey),
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

  const stats = useMemo(() => {
    const list = data ?? []
    const total = list.length
    /* Janela móvel de 7 dias relativa ao render (dados atualizados) */
    // eslint-disable-next-line react-hooks/purity -- Date.now só para comparação com updated_at
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recent = list.filter((r) => {
      const t = new Date(r.updated_at).getTime()
      return !Number.isNaN(t) && t >= weekAgo
    }).length
    const fieldCounts = list.map((r) => parseFormSchema(r.schema).length)
    const avgFields =
      fieldCounts.length > 0
        ? Math.round(
            (fieldCounts.reduce((s, n) => s + n, 0) / fieldCounts.length) * 10,
          ) / 10
        : 0
    return { total, recent, avgFields }
  }, [data])

  const handleCreateLink = async (templateId: string) => {
    try {
      const row = await createLink.mutateAsync(templateId)
      const url = `${window.location.origin}/f/${row.public_token}`
      await navigator.clipboard.writeText(url)
      showSuccess('Link público copiado para a área de transferência.')
    } catch (e) {
      showError(e instanceof Error ? e : new Error(String(e)))
    }
  }

  const previewFields = useMemo(
    () => (previewRow ? parseFormSchema(previewRow.schema) : []),
    [previewRow],
  )

  const rowToDelete = useMemo(
    () => (deleteId ? data?.find((r) => r.id === deleteId) : null),
    [deleteId, data],
  )

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await remove.mutateAsync(deleteId)
      setDeleteId(null)
      showSuccess('Formulário eliminado.')
    } catch (e) {
      showError(e instanceof Error ? e : new Error(String(e)))
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Painel', to: '/' },
          { label: 'Formulários' },
        ]}
        title="Formulários"
        actions={
          <Button asChild>
            <Link to="/forms/new">
              <Plus />
              Novo formulário
            </Link>
          </Button>
        }
      />

      {!isLoading && !isError ? (
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Total de modelos', value: stats.total },
            { label: 'Atualizados (7 dias)', value: stats.recent },
            { label: 'Média de perguntas / formulário', value: stats.avgFields },
          ].map((stat) => (
            <GlassPanel key={stat.label} className="py-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="display mt-1 text-2xl font-semibold">{stat.value}</p>
            </GlassPanel>
          ))}
        </div>
      ) : null}

      <ApiConfigAlert />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por título ou data…"
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
        <EmptyState title="Nenhum formulário." />
      ) : null}
      {data && data.length > 0 ? (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="w-full text-sm text-muted-foreground sm:w-auto">
              Ordenar por
            </span>
            {(
              [
                { key: 'title' as const, label: 'Título' },
                { key: 'updated_at' as const, label: 'Atualização' },
              ] as const
            ).map(({ key, label }) => (
              <Badge
                key={key}
                variant={orderBy === key ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => handleRequestSort(key)}
              >
                {label}
                {orderBy === key ? (order === 'asc' ? ' ↑' : ' ↓') : ''}
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredSorted.map((row) => (
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
                          className="h-8 w-8"
                          aria-label="Pré-visualizar"
                          onClick={() => setPreviewRow(row)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Pré-visualizar perguntas</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary"
                          aria-label="Editar formulário"
                          asChild
                        >
                          <Link to={`/forms/${row.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
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
                          className="h-8 w-8"
                          aria-label="Link público"
                          onClick={() => void handleCreateLink(row.id)}
                          disabled={createLink.isPending}
                        >
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copiar link público</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          aria-label="Eliminar formulário"
                          onClick={() => setDeleteId(row.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Eliminar</TooltipContent>
                    </Tooltip>
                  </>
                }
              >
                <p className="font-semibold">{row.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Atualizado em {formatDate(row.updated_at)}
                </p>
              </ListCard>
            ))}
          </div>
        </div>
      ) : null}

      <Dialog open={Boolean(previewRow)} onOpenChange={(v) => !v && setPreviewRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pré-visualização: {previewRow?.title}</DialogTitle>
          </DialogHeader>
          {previewFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem perguntas definidas.</p>
          ) : (
            <ul className="divide-y divide-border">
              {previewFields.map((f) => (
                <li key={f.id} className="py-2">
                  <p className="font-medium">{f.label}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge variant="outline">{fieldTypeLabel(f.type)}</Badge>
                    {f.required ? (
                      <Badge variant="outline">Obrigatório</Badge>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPreviewRow(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteId)}
        title="Eliminar formulário?"
        message={
          <>
            Os links públicos e respostas associadas podem ser removidos pela base de
            dados. Confirma a eliminação de{' '}
            <strong>{rowToDelete?.title ?? 'este modelo'}</strong>?
          </>
        }
        loading={remove.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
