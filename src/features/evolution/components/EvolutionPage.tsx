import {
  Alert,
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  type SelectChangeEvent,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ConfirmDeleteDialog } from '../../../components/ConfirmDeleteDialog'
import { ListPageSkeleton } from '../../../components/ListPageSkeleton'
import { PageBreadcrumbs } from '../../../components/PageBreadcrumbs'
import { RichTextEditor } from '../../../components/RichTextEditor'
import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { isRichTextEmpty } from '../../../lib/richText'
import { usePatientEvaluationForms } from '../../evaluation-forms/hooks/usePatientEvaluationForms'
import { usePatient } from '../../patients/hooks/usePatients'
import {
  useCreateEvolution,
  useDeleteEvolutionEntry,
  useEvolutionEntries,
  useUpdateEvolutionEntry,
} from '../hooks/useEvolution'
import type { EvolutionRow } from '../services/evolutionApi'
import {
  EvolutionEntriesAccordion,
  formatEvolutionDate,
} from './EvolutionEntriesAccordion'

type FormMode = 'create' | 'edit'

const emptyForm = () => ({
  content: '',
  entryDate: new Date().toISOString().slice(0, 10),
  evaluationFormId: '',
})

function rowToForm(row: EvolutionRow) {
  return {
    content: row.content,
    entryDate: row.entry_date.slice(0, 10),
    evaluationFormId: row.patient_evaluation_form_id,
  }
}

export function EvolutionPage() {
  const { id: patientId } = useParams<{ id: string }>()
  const { data: patient } = usePatient(patientId)
  const { data, isLoading, isError, error } = useEvolutionEntries(patientId)
  const { data: evaluationForms, isLoading: loadingForms } =
    usePatientEvaluationForms(patientId)
  const create = useCreateEvolution(patientId ?? '')
  const update = useUpdateEvolutionEntry(patientId ?? '')
  const removeEntry = useDeleteEvolutionEntry(patientId ?? '')

  const [mode, setMode] = useState<FormMode>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [entryDate, setEntryDate] = useState(() => emptyForm().entryDate)
  const [evaluationFormId, setEvaluationFormId] = useState('')
  const [expandedId, setExpandedId] = useState<string | false>(false)
  const [entryToDelete, setEntryToDelete] = useState<EvolutionRow | null>(null)

  const formTitleById = useMemo(
    () => new Map((evaluationForms ?? []).map((f) => [f.id, f.title])),
    [evaluationForms],
  )

  const resetForm = () => {
    const empty = emptyForm()
    setMode('create')
    setEditingId(null)
    setContent(empty.content)
    setEntryDate(empty.entryDate)
    setEvaluationFormId(empty.evaluationFormId)
  }

  const startEdit = (row: EvolutionRow) => {
    const values = rowToForm(row)
    setMode('edit')
    setEditingId(row.id)
    setContent(values.content)
    setEntryDate(values.entryDate)
    setEvaluationFormId(values.evaluationFormId)
    setExpandedId(row.id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId || isRichTextEmpty(content) || !evaluationFormId) return

    const payload = {
      content: content.trim(),
      entryDate,
      patientEvaluationFormId: evaluationFormId,
    }

    try {
      if (mode === 'edit' && editingId) {
        const savedId = editingId
        await update.mutateAsync({ entryId: editingId, ...payload })
        resetForm()
        setExpandedId(savedId)
      } else {
        await create.mutateAsync(payload)
        resetForm()
      }
    } catch {
      /* erro na mutation */
    }
  }

  const confirmDeleteEntry = async () => {
    if (!entryToDelete) return
    try {
      await removeEntry.mutateAsync(entryToDelete.id)
      if (editingId === entryToDelete.id) {
        resetForm()
      }
      if (expandedId === entryToDelete.id) {
        setExpandedId(false)
      }
      setEntryToDelete(null)
    } catch {
      /* toast no hook */
    }
  }

  const formsAvailable = (evaluationForms?.length ?? 0) > 0
  const isPending = create.isPending || update.isPending
  const mutationError = create.error ?? update.error
  const submitDisabled =
    isPending ||
    !evaluationFormId ||
    !formsAvailable ||
    isRichTextEmpty(content)

  if (!patientId) {
    return <Alert severity="error">Paciente inválido.</Alert>
  }

  return (
    <Box>
      <PageBreadcrumbs
        items={[
          { label: 'Painel', to: '/' },
          { label: 'Pacientes', to: '/patients' },
          ...(patient && patientId
            ? [
                { label: patient.full_name, to: `/patients/${patientId}` },
                { label: 'Evolução' },
              ]
            : [{ label: 'Evolução' }]),
        ]}
      />
      <Typography variant="h4" component="h2" gutterBottom>
        Evolução
      </Typography>
      <Button component={Link} to={`/patients/${patientId}`} sx={{ mb: 2 }}>
        Voltar ao paciente
      </Button>
      <SupabaseConfigAlert />

      {loadingForms ? (
        <ListPageSkeleton count={1} cardHeight={48} />
      ) : null}
      {!loadingForms && evaluationForms && evaluationForms.length === 0 ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          É necessário adicionar uma ficha de avaliação antes de registar evolução.{' '}
          <Link to={`/patients/${patientId}/evaluation-forms/new`}>
            Adicionar ficha
          </Link>
        </Alert>
      ) : null}

      <Grid container spacing={3} alignItems="flex-start">
        <Grid size={{ xs: 12, md: 5 }}>
          <Typography variant="h6" component="h3" gutterBottom>
            {mode === 'edit' ? 'Editar registo' : 'Novo registo'}
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2}>
              <FormControl fullWidth required>
                <InputLabel id="evaluation-form-label">Ficha de avaliação</InputLabel>
                <Select
                  labelId="evaluation-form-label"
                  label="Ficha de avaliação"
                  value={evaluationFormId}
                  onChange={(e: SelectChangeEvent) =>
                    setEvaluationFormId(e.target.value)
                  }
                  disabled={!formsAvailable}
                >
                  <MenuItem value="">
                    <em>Selecionar ficha…</em>
                  </MenuItem>
                  {(evaluationForms ?? []).map((f) => (
                    <MenuItem key={f.id} value={f.id}>
                      {f.title} ({formatEvolutionDate(f.evaluation_date)})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                type="date"
                label="Data"
                slotProps={{ inputLabel: { shrink: true } }}
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                fullWidth
              />
              <RichTextEditor
                label="Registo de evolução"
                value={content}
                onChange={setContent}
              />
              {mutationError ? (
                <Alert severity="error">{(mutationError as Error).message}</Alert>
              ) : null}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitDisabled}
                >
                  {mode === 'edit' ? 'Guardar alterações' : 'Adicionar registo'}
                </Button>
                {mode === 'edit' ? (
                  <Button type="button" variant="outlined" onClick={resetForm}>
                    Cancelar edição
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Stack
            direction="row"
            alignItems="baseline"
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 1.5 }}
          >
            <Typography variant="h6" component="h3">
              Histórico de evolução
            </Typography>
            {!isLoading && data ? (
              <Typography variant="body2" color="text.secondary">
                {data.length} registo{data.length !== 1 ? 's' : ''}
              </Typography>
            ) : null}
          </Stack>
          <Box
            sx={{
              maxHeight: { md: 'calc(100vh - 220px)' },
              overflowY: { md: 'auto' },
              pr: { md: 0.5 },
              pt: { md: 0.25 },
            }}
          >
            <EvolutionEntriesAccordion
              entries={data}
              formTitleById={formTitleById}
              isLoading={isLoading}
              isError={isError}
              error={error as Error | null}
              expandedId={expandedId}
              editingId={editingId}
              onExpandedChange={setExpandedId}
              onEdit={startEdit}
              onDelete={setEntryToDelete}
              deleteDisabled={removeEntry.isPending}
            />
          </Box>
        </Grid>
      </Grid>

      <ConfirmDeleteDialog
        open={Boolean(entryToDelete)}
        title="Eliminar registo de evolução?"
        message={
          <>
            Esta ação não pode ser anulada. Confirma a eliminação do registo de{' '}
            <strong>
              {entryToDelete ? formatEvolutionDate(entryToDelete.entry_date) : ''}
            </strong>
            ?
          </>
        }
        loading={removeEntry.isPending}
        onCancel={() => setEntryToDelete(null)}
        onConfirm={() => void confirmDeleteEntry()}
      />
    </Box>
  )
}
