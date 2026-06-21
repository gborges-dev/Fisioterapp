import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SearchIcon from '@mui/icons-material/Search'
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { ConfirmDeleteDialog } from '../../../components/ConfirmDeleteDialog'
import { ListCard } from '../../../components/ListCard'
import { ListPageSkeleton } from '../../../components/ListPageSkeleton'
import { PageBreadcrumbs } from '../../../components/PageBreadcrumbs'
import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { toastError, toastSuccess } from '../../../components/toast'
import { useSortState, useTableFilterSort } from '../../../hooks/useTableFilterSort'
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
    <Box>
      <PageBreadcrumbs
        items={[
          { label: 'Painel', to: '/' },
          { label: 'Fichas de avaliação' },
        ]}
      />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Typography variant="h4" component="h2">
          Fichas de avaliação
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to="/evaluation-forms/new"
          sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
        >
          Novo modelo
        </Button>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Crie modelos de ficha para diferentes áreas de atendimento. Depois vincule
        uma ficha a cada paciente conforme necessário.
      </Typography>

      <SupabaseConfigAlert />
      <TextField
        placeholder="Pesquisar modelos…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 2, maxWidth: { xs: 'none', sm: 480 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="action" />
            </InputAdornment>
          ),
        }}
      />

      {isLoading ? <ListPageSkeleton /> : null}
      {isError ? (
        <Alert severity="error">{(error as Error).message}</Alert>
      ) : null}
      {!isLoading && !isError && data && data.length === 0 ? (
        <Typography>Nenhum modelo registado.</Typography>
      ) : null}
      {!isLoading && !isError && data && data.length > 0 ? (
        <Box>
          <Stack
            direction="row"
            flexWrap="wrap"
            alignItems="center"
            gap={1}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2" color="text.secondary">
              Ordenar por
            </Typography>
            {(
              [
                { key: 'title' as const, label: 'Título' },
                { key: 'updated_at' as const, label: 'Atualização' },
              ] as const
            ).map(({ key, label }) => (
              <Chip
                key={key}
                size="small"
                label={`${label}${orderBy === key ? (order === 'asc' ? ' ↑' : ' ↓') : ''}`}
                onClick={() => handleRequestSort(key)}
                color={orderBy === key ? 'primary' : 'default'}
                variant={orderBy === key ? 'filled' : 'outlined'}
              />
            ))}
          </Stack>
          <Grid container spacing={2}>
            {filteredSorted.map((t) => (
              <Grid key={t.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <ListCard
                  actions={
                    <>
                      <Tooltip title="Editar modelo">
                        <IconButton
                          component={Link}
                          to={`/evaluation-forms/${t.id}/edit`}
                          size="small"
                          color="primary"
                          aria-label="Editar modelo"
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar modelo">
                        <IconButton
                          size="small"
                          color="error"
                          aria-label="Eliminar modelo"
                          onClick={() => setDeleteId(t.id)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  }
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {t.title}
                  </Typography>
                  {t.description?.trim() ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {t.description}
                    </Typography>
                  ) : null}
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Atualizado {formatDate(t.updated_at)}
                  </Typography>
                </ListCard>
              </Grid>
            ))}
          </Grid>
        </Box>
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
    </Box>
  )
}
