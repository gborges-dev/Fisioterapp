import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SearchIcon from '@mui/icons-material/Search'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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

import { PageBreadcrumbs } from '../../../components/PageBreadcrumbs'
import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { useSortState, useTableFilterSort } from '../../../hooks/useTableFilterSort'
import {
  useEvaluationFormTemplateMutations,
  useEvaluationFormTemplates,
} from '../hooks/useEvaluationFormTemplates'
import { parseEvaluationSchema } from '../services/evaluationFormsApi'
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
      setDeleteId(null)
    } catch {
      /* toast pode ser acrescentado */
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
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h2">
          Fichas de avaliação
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to="/evaluation-forms/new"
        >
          Novo modelo
        </Button>
      </Box>

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

      {isLoading ? <CircularProgress aria-label="A carregar modelos" /> : null}
      {isError ? (
        <Alert severity="error">{(error as Error).message}</Alert>
      ) : null}
      {data && data.length === 0 ? (
        <Typography>Nenhum modelo registado.</Typography>
      ) : null}
      {data && data.length > 0 ? (
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
            {filteredSorted.map((t) => {
              const fieldCount = parseEvaluationSchema(t.schema).length
              return (
                <Grid key={t.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                    <CardContent>
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
                        {fieldCount} campo{fieldCount !== 1 ? 's' : ''} · Atualizado{' '}
                        {formatDate(t.updated_at)}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
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
                    </CardActions>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        </Box>
      ) : null}

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Eliminar modelo?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Esta ação não pode ser anulada. Confirma a eliminação de{' '}
            <strong>{templateToDelete?.title ?? 'este modelo'}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void confirmDelete()}
            disabled={remove.isPending}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
