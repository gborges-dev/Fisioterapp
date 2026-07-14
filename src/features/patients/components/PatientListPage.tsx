import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SearchIcon from '@mui/icons-material/Search'
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined'
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
    <Box>
      <PageBreadcrumbs
        items={[
          { label: 'Painel', to: '/' },
          { label: 'Pacientes' },
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
          Pacientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to="/patients/new"
        >
          Novo paciente
        </Button>
      </Box>

      <SupabaseConfigAlert />
      <TextField
        placeholder="Pesquisar por nome, email ou telefone…"
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
      {data && data.length === 0 ? (
        <Typography>Nenhum paciente registado.</Typography>
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
                { key: 'full_name' as const, label: 'Nome' },
                { key: 'email' as const, label: 'Email' },
                { key: 'phone' as const, label: 'Telefone' },
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
            {filteredSorted.map((p) => (
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <ListCard
                  actions={
                    <>
                      <Tooltip title="Fichas de avaliação">
                        <IconButton
                          component={Link}
                          to={patientTabPath(p.id, 'fichas')}
                          size="small"
                          color="primary"
                          aria-label="Fichas de avaliação"
                        >
                          <AssignmentOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Evolução">
                        <IconButton
                          component={Link}
                          to={patientTabPath(p.id, 'evolucao')}
                          size="small"
                          color="primary"
                          aria-label="Evolução"
                        >
                          <TimelineOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar paciente">
                        <IconButton
                          component={Link}
                          to={`/patients/${p.id}/edit`}
                          size="small"
                          color="primary"
                          aria-label="Editar paciente"
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar paciente">
                        <IconButton
                          size="small"
                          color="error"
                          aria-label="Eliminar paciente"
                          onClick={() => setDeleteId(p.id)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  }
                >
                  <Typography
                    variant="subtitle1"
                    component={Link}
                    to={`/patients/${p.id}`}
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      textDecoration: 'none',
                      '&:hover': { color: 'primary.main' },
                    }}
                  >
                    {p.full_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {p.email?.trim() || 'Sem email'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {p.phone?.trim() || 'Sem telefone'}
                  </Typography>
                </ListCard>
              </Grid>
            ))}
          </Grid>
        </Box>
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
    </Box>
  )
}
