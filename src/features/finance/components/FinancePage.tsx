import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SearchIcon from '@mui/icons-material/Search'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  type SelectChangeEvent,
} from '@mui/material'
import { useCallback, useMemo, useState } from 'react'

import { ConfirmDeleteDialog } from '../../../components/ConfirmDeleteDialog'
import { ListCard } from '../../../components/ListCard'
import { ListPageSkeleton } from '../../../components/ListPageSkeleton'
import { PageBreadcrumbs } from '../../../components/PageBreadcrumbs'
import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { usePatients } from '../../patients/hooks/usePatients'
import type { PatientRow } from '../../patients/services/patientsApi'
import {
  useFinanceEntries,
  useFinanceMutations,
  type NewFinanceEntryInput,
} from '../hooks/useFinance'
import type {
  FinanceEntryType,
  FinanceEntryWithPatient,
} from '../services/financeApi'

function defaultDateRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return {
    from: from.toLocaleDateString('sv-SE'),
    to: to.toLocaleDateString('sv-SE'),
  }
}

function formatMoney(value: number | string) {
  const n = typeof value === 'number' ? value : Number(value)
  return (Number.isFinite(n) ? n : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatDate(iso: string) {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

function toAmountNumber(value: number | string) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

const emptyForm = (): NewFinanceEntryInput => ({
  type: 'entrada',
  amount: 0,
  entryDate: new Date().toLocaleDateString('sv-SE'),
  description: '',
  patientId: null,
})

export function FinancePage() {
  const range = useMemo(() => defaultDateRange(), [])
  const [from, setFrom] = useState(range.from)
  const [to, setTo] = useState(range.to)
  const [patient, setPatient] = useState<PatientRow | null>(null)
  const [typeFilter, setTypeFilter] = useState<FinanceEntryType | ''>('')
  const [filter, setFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FinanceEntryWithPatient | null>(null)
  const [form, setForm] = useState<NewFinanceEntryInput>(emptyForm)
  const [amountText, setAmountText] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<FinanceEntryWithPatient | null>(
    null,
  )

  const { data: patients } = usePatients()
  const { data, isLoading, isError, error } = useFinanceEntries({
    from,
    to,
    patientId: patient?.id ?? null,
    type: typeFilter || null,
  })
  const { create, update, remove } = useFinanceMutations()

  const getHaystack = useCallback(
    (row: FinanceEntryWithPatient) =>
      [
        row.description,
        row.patients?.full_name ?? '',
        row.type,
        String(row.amount),
      ].join(' '),
    [],
  )

  const filtered = useMemo(() => {
    if (!data?.length) return []
    const q = filter
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .trim()
    if (!q) return data
    return data.filter((row) =>
      getHaystack(row)
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .includes(q),
    )
  }, [data, filter, getHaystack])

  const totals = useMemo(() => {
    let entradas = 0
    let saidas = 0
    for (const row of filtered) {
      const amount = toAmountNumber(row.amount)
      if (row.type === 'entrada') entradas += amount
      else saidas += amount
    }
    return { entradas, saidas }
  }, [filtered])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setAmountText('')
    setDialogOpen(true)
  }

  const openEdit = (row: FinanceEntryWithPatient) => {
    setEditing(row)
    setForm({
      type: row.type,
      amount: toAmountNumber(row.amount),
      entryDate: row.entry_date.slice(0, 10),
      description: row.description,
      patientId: row.patient_id,
    })
    setAmountText(String(toAmountNumber(row.amount)))
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditing(null)
  }

  const selectedPatient =
    patients?.find((p) => p.id === form.patientId) ?? null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(amountText.replace(',', '.'))
    if (!Number.isFinite(amount) || amount <= 0) return
    if (!form.description.trim()) return

    const payload: NewFinanceEntryInput = {
      ...form,
      amount,
      description: form.description.trim(),
      patientId: form.patientId || null,
    }

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...payload })
      } else {
        await create.mutateAsync(payload)
      }
      closeDialog()
    } catch {
      /* toast no hook */
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await remove.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      /* toast no hook */
    }
  }

  const saving = create.isPending || update.isPending

  return (
    <Box>
      <PageBreadcrumbs
        items={[
          { label: 'Painel', to: '/' },
          { label: 'Financeiro' },
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
          Financeiro
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          Novo lançamento
        </Button>
      </Box>

      <SupabaseConfigAlert />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total de entradas
              </Typography>
              <Typography variant="h5" sx={{ color: 'success.main', mt: 0.5 }}>
                {formatMoney(totals.entradas)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total de saídas
              </Typography>
              <Typography variant="h5" sx={{ color: 'error.main', mt: 0.5 }}>
                {formatMoney(totals.saidas)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 2 }}
        useFlexGap
        flexWrap="wrap"
      >
        <TextField
          placeholder="Pesquisar descrição, paciente…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: { xs: '100%', sm: 240 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          type="date"
          label="De"
          size="small"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          type="date"
          label="Até"
          size="small"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
          <InputLabel id="finance-type-filter-label">Tipo</InputLabel>
          <Select
            labelId="finance-type-filter-label"
            label="Tipo"
            value={typeFilter}
            onChange={(e: SelectChangeEvent) =>
              setTypeFilter(e.target.value as FinanceEntryType | '')
            }
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="entrada">Entradas</MenuItem>
            <MenuItem value="saida">Saídas</MenuItem>
          </Select>
        </FormControl>
        <Autocomplete
          size="small"
          sx={{ minWidth: { xs: '100%', sm: 260 } }}
          options={patients ?? []}
          value={patient}
          onChange={(_, value) => setPatient(value)}
          getOptionLabel={(o) => o.full_name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          renderInput={(params) => (
            <TextField {...params} label="Paciente" placeholder="Todos" />
          )}
        />
      </Stack>

      {isLoading ? <ListPageSkeleton /> : null}
      {isError ? (
        <Alert severity="error">{(error as Error).message}</Alert>
      ) : null}
      {!isLoading && !isError && filtered.length === 0 ? (
        <Typography color="text.secondary">
          Nenhum lançamento no período filtrado.
        </Typography>
      ) : null}

      {!isLoading && !isError && filtered.length > 0 ? (
        <Grid container spacing={2}>
          {filtered.map((row) => (
            <Grid key={row.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <ListCard
                actions={
                  <>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        color="primary"
                        aria-label="Editar lançamento"
                        onClick={() => openEdit(row)}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Eliminar lançamento"
                        onClick={() => setDeleteTarget(row)}
                        disabled={remove.isPending}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                }
              >
                <Typography
                  variant="overline"
                  sx={{
                    color: row.type === 'entrada' ? 'success.main' : 'error.main',
                  }}
                >
                  {row.type === 'entrada' ? 'Entrada' : 'Saída'}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatMoney(row.amount)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {row.description.trim() || '—'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {formatDate(row.entry_date)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {row.patients?.full_name ?? 'Sem paciente'}
                </Typography>
              </ListCard>
            </Grid>
          ))}
        </Grid>
      ) : null}

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>
            {editing ? 'Editar lançamento' : 'Novo lançamento'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth required>
                <InputLabel id="finance-type-label">Tipo</InputLabel>
                <Select
                  labelId="finance-type-label"
                  label="Tipo"
                  value={form.type}
                  onChange={(e: SelectChangeEvent) =>
                    setForm((f) => ({
                      ...f,
                      type: e.target.value as FinanceEntryType,
                    }))
                  }
                >
                  <MenuItem value="entrada">Entrada</MenuItem>
                  <MenuItem value="saida">Saída</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Valor"
                required
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                inputMode="decimal"
                fullWidth
              />
              <TextField
                type="date"
                label="Data"
                required
                value={form.entryDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, entryDate: e.target.value }))
                }
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <TextField
                label="Descrição"
                required
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                fullWidth
                multiline
                minRows={2}
              />
              <Autocomplete
                options={patients ?? []}
                value={selectedPatient}
                onChange={(_, value) =>
                  setForm((f) => ({ ...f, patientId: value?.id ?? null }))
                }
                getOptionLabel={(o) => o.full_name}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Paciente (opcional)"
                    placeholder="Sem paciente"
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {editing ? 'Guardar' : 'Criar'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Eliminar lançamento?"
        message={
          <>
            Confirma a eliminação do lançamento de{' '}
            <strong>
              {deleteTarget ? formatMoney(deleteTarget.amount) : ''}
            </strong>
            {deleteTarget?.description
              ? (
                  <>
                    {' '}
                    ({deleteTarget.description})
                  </>
                )
              : null}
            ?
          </>
        }
        loading={remove.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </Box>
  )
}
