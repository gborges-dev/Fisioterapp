import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LinkIcon from '@mui/icons-material/Link'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
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
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageBreadcrumbs } from '../../../components/PageBreadcrumbs'
import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { useToast } from '../../../components/toast'
import { useSortState, useTableFilterSort } from '../../../hooks/useTableFilterSort'
import type { FormFieldType } from '../../../types/database.types'
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
    <Box>
      <PageBreadcrumbs
        items={[
          { label: 'Painel', to: '/' },
          { label: 'Formulários' },
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
          Formulários
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to="/forms/new"
        >
          Novo formulário
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography color="text.secondary" variant="body2">
                Total de modelos
              </Typography>
              <Typography variant="h5">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography color="text.secondary" variant="body2">
                Atualizados (7 dias)
              </Typography>
              <Typography variant="h5">{stats.recent}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography color="text.secondary" variant="body2">
                Média de perguntas / formulário
              </Typography>
              <Typography variant="h5">{stats.avgFields}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <SupabaseConfigAlert />
      <TextField
        placeholder="Pesquisar por título ou data…"
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

      {isLoading ? <CircularProgress /> : null}
      {isError ? (
        <Alert severity="error">{(error as Error).message}</Alert>
      ) : null}
      {data && data.length === 0 ? (
        <Typography>Nenhum formulário.</Typography>
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
            <Typography variant="body2" color="text.secondary" sx={{ width: { xs: '100%', sm: 'auto' } }}>
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
            {filteredSorted.map((row) => (
              <Grid key={row.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    transition: (t) =>
                      t.transitions.create(['box-shadow', 'border-color'], {
                        duration: t.transitions.duration.shorter,
                      }),
                    '&:hover': {
                      borderColor: 'primary.light',
                      boxShadow: (t) => t.shadows[2],
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {row.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Atualizado em {formatDate(row.updated_at)}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', flexWrap: 'wrap', px: 2, pb: 2, pt: 0, gap: 0.5 }}>
                    <Tooltip title="Pré-visualizar perguntas">
                      <IconButton
                        size="small"
                        aria-label="Pré-visualizar"
                        onClick={() => setPreviewRow(row)}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton
                        component={Link}
                        to={`/forms/${row.id}/edit`}
                        size="small"
                        color="primary"
                        aria-label="Editar formulário"
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Copiar link público">
                      <IconButton
                        size="small"
                        aria-label="Link público"
                        onClick={() => void handleCreateLink(row.id)}
                        disabled={createLink.isPending}
                      >
                        <LinkIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Eliminar formulário"
                        onClick={() => setDeleteId(row.id)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : null}

      <Dialog
        open={Boolean(previewRow)}
        onClose={() => setPreviewRow(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Pré-visualização: {previewRow?.title}</DialogTitle>
        <DialogContent dividers>
          {previewFields.length === 0 ? (
            <Typography color="text.secondary">Sem perguntas definidas.</Typography>
          ) : (
            <List dense disablePadding>
              {previewFields.map((f) => (
                <ListItem key={f.id} disableGutters sx={{ py: 0.5, alignItems: 'flex-start' }}>
                  <ListItemText
                    primary={f.label}
                    secondary={
                      <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip
                          size="small"
                          label={fieldTypeLabel(f.type)}
                          variant="outlined"
                          component="span"
                        />
                        {f.required ? (
                          <Chip size="small" label="Obrigatório" color="primary" variant="outlined" component="span" />
                        ) : null}
                      </Box>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewRow(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Eliminar formulário?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Os links públicos e respostas associadas podem ser removidos pela base de
            dados. Confirma a eliminação de{' '}
            <strong>{rowToDelete?.title ?? 'este modelo'}</strong>?
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
