import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SearchIcon from '@mui/icons-material/Search'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
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
        placeholder="Pesquisar em todas as colunas…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 2, maxWidth: 480 }}
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
        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sortDirection={orderBy === 'full_name' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'full_name'}
                    direction={orderBy === 'full_name' ? order : 'asc'}
                    onClick={() => handleRequestSort('full_name')}
                  >
                    Nome
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sortDirection={orderBy === 'email' ? order : false}
                  sx={{ display: { xs: 'none', sm: 'table-cell' } }}
                >
                  <TableSortLabel
                    active={orderBy === 'email'}
                    direction={orderBy === 'email' ? order : 'asc'}
                    onClick={() => handleRequestSort('email')}
                  >
                    Email
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sortDirection={orderBy === 'phone' ? order : false}
                  sx={{ display: { xs: 'none', md: 'table-cell' } }}
                >
                  <TableSortLabel
                    active={orderBy === 'phone'}
                    direction={orderBy === 'phone' ? order : 'asc'}
                    onClick={() => handleRequestSort('phone')}
                  >
                    Telefone
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSorted.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <MuiLink component={Link} to={`/patients/${p.id}`} fontWeight={500}>
                      {p.full_name}
                    </MuiLink>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    {p.email ?? '—'}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    {p.phone ?? '—'}
                  </TableCell>
                  <TableCell align="right">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
