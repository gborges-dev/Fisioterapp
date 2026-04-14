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
import { usePatientMutations, usePatients } from '../hooks/usePatients'
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

  const stats = useMemo(() => {
    const list = data ?? []
    const total = list.length
    const withPhone = list.filter((p) => p.phone?.trim()).length
    const withReason = list.filter((p) => p.consultation_reason?.trim()).length
    return { total, withPhone, withReason }
  }, [data])

  const patientToDelete = useMemo(
    () => (deleteId ? data?.find((p) => p.id === deleteId) : null),
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

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography color="text.secondary" variant="body2">
                Total
              </Typography>
              <Typography variant="h5">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography color="text.secondary" variant="body2">
                Com telefone
              </Typography>
              <Typography variant="h5">{stats.withPhone}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography color="text.secondary" variant="body2">
                Com motivo de consulta
              </Typography>
              <Typography variant="h5">{stats.withReason}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

      {isLoading ? <CircularProgress aria-label="A carregar pacientes" /> : null}
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
              <Grid key={p.id} size={{ xs: 12, sm: 6, lg: 4 }}>
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
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2, pt: 0 }}>
                    <Tooltip title="Editar ficha">
                      <IconButton
                        component={Link}
                        to={`/patients/${p.id}/edit`}
                        size="small"
                        color="primary"
                        aria-label="Editar ficha"
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
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : null}

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Eliminar paciente?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Esta ação não pode ser anulada. Confirma a eliminação de{' '}
            <strong>{patientToDelete?.full_name ?? 'este paciente'}</strong>?
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
