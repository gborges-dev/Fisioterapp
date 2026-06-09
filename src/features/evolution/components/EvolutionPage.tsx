import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
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
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { PageBreadcrumbs } from '../../../components/PageBreadcrumbs'
import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { usePatientEvaluationForms } from '../../evaluation-forms/hooks/usePatientEvaluationForms'
import { usePatient } from '../../patients/hooks/usePatients'
import { useCreateEvolution, useEvolutionEntries } from '../hooks/useEvolution'

function formatDate(iso: string) {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function EvolutionPage() {
  const { id: patientId } = useParams<{ id: string }>()
  const { data: patient } = usePatient(patientId)
  const { data, isLoading, isError, error } = useEvolutionEntries(patientId)
  const { data: evaluationForms, isLoading: loadingForms } =
    usePatientEvaluationForms(patientId)
  const create = useCreateEvolution(patientId ?? '')
  const [content, setContent] = useState('')
  const [entryDate, setEntryDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  )
  const [evaluationFormId, setEvaluationFormId] = useState('')

  const formTitleById = new Map(
    (evaluationForms ?? []).map((f) => [f.id, f.title]),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId || !content.trim() || !evaluationFormId) return
    try {
      await create.mutateAsync({
        content: content.trim(),
        entryDate,
        patientEvaluationFormId: evaluationFormId,
      })
      setContent('')
    } catch {
      /* erro na mutation */
    }
  }

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

      {loadingForms ? <CircularProgress sx={{ mb: 2 }} /> : null}
      {!loadingForms && evaluationForms && evaluationForms.length === 0 ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          É necessário adicionar uma ficha de avaliação antes de registar evolução.{' '}
          <Link to={`/patients/${patientId}/evaluation-forms/new`}>
            Adicionar ficha
          </Link>
        </Alert>
      ) : null}

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mb: 3 }}>
        <Stack spacing={2} sx={{ maxWidth: 640 }}>
          <FormControl fullWidth required>
            <InputLabel id="evaluation-form-label">Ficha de avaliação</InputLabel>
            <Select
              labelId="evaluation-form-label"
              label="Ficha de avaliação"
              value={evaluationFormId}
              onChange={(e: SelectChangeEvent) =>
                setEvaluationFormId(e.target.value)
              }
              disabled={(evaluationForms?.length ?? 0) === 0}
            >
              <MenuItem value="">
                <em>Selecionar ficha…</em>
              </MenuItem>
              {(evaluationForms ?? []).map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.title} ({formatDate(f.evaluation_date)})
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
          <TextField
            label="Registo de evolução"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            multiline
            minRows={4}
            fullWidth
          />
          {create.error ? (
            <Alert severity="error">{(create.error as Error).message}</Alert>
          ) : null}
          <Button
            type="submit"
            variant="contained"
            disabled={
              create.isPending ||
              !evaluationFormId ||
              (evaluationForms?.length ?? 0) === 0
            }
          >
            Adicionar registo
          </Button>
        </Stack>
      </Box>
      {isLoading ? <CircularProgress /> : null}
      {isError ? (
        <Alert severity="error">{(error as Error).message}</Alert>
      ) : null}
      <Grid container spacing={2}>
        {data?.map((row) => (
          <Grid key={row.id} size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  {row.entry_date}
                  {row.patient_evaluation_form_id
                    ? ` · ${formTitleById.get(row.patient_evaluation_form_id) ?? 'Ficha'}`
                    : ''}
                </Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>
                  {row.content}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {data && data.length === 0 ? (
        <Typography color="text.secondary">Sem registos ainda.</Typography>
      ) : null}
    </Box>
  )
}
