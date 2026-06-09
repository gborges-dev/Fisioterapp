import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import { Link, useParams } from 'react-router-dom'

import { PageBreadcrumbs } from '../../../components/PageBreadcrumbs'
import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { usePatientEvaluationForms } from '../../evaluation-forms/hooks/usePatientEvaluationForms'
import {
  parseAnswers,
  parseEvaluationSchema,
} from '../../evaluation-forms/services/evaluationFormsApi'
import { useEvolutionEntries } from '../../evolution/hooks/useEvolution'
import { usePatient } from '../hooks/usePatients'

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

export function PatientComparePage() {
  const { id } = useParams<{ id: string }>()
  const { data: patient, isLoading: lp, isError: ep, error: errP } =
    usePatient(id)
  const { data: forms, isLoading: lf } = usePatientEvaluationForms(id)
  const { data: evo, isLoading: le, isError: ee, error: errE } =
    useEvolutionEntries(id)

  const loading = lp || le || lf

  if (!id) {
    return <Alert severity="error">Paciente inválido.</Alert>
  }

  return (
    <Box>
      <PageBreadcrumbs
        items={[
          { label: 'Painel', to: '/' },
          { label: 'Pacientes', to: '/patients' },
          ...(patient
            ? [
                { label: patient.full_name, to: `/patients/${id}` },
                { label: 'Ficha vs evolução' },
              ]
            : [{ label: 'Comparar' }]),
        ]}
      />
      <Typography variant="h4" component="h2" gutterBottom>
        Ficha vs evolução
      </Typography>
      <Button component={Link} to={`/patients/${id}`} sx={{ mb: 2 }}>
        Voltar ao paciente
      </Button>
      <SupabaseConfigAlert />
      {loading ? <CircularProgress /> : null}
      {ep ? (
        <Alert severity="error">{(errP as Error).message}</Alert>
      ) : null}
      {ee ? (
        <Alert severity="error">{(errE as Error).message}</Alert>
      ) : null}
      {patient ? (
        <Stack spacing={3}>
          {!forms?.length ? (
            <Alert severity="info">
              Este paciente ainda não tem fichas de avaliação.{' '}
              <Link to={`/patients/${id}/evaluation-forms/new`}>
                Adicionar ficha
              </Link>
            </Alert>
          ) : (
            forms.map((form) => {
              const fields = parseEvaluationSchema(form.schema)
              const answers = parseAnswers(form.answers)
              const linkedEvolution =
                evo?.filter(
                  (row) => row.patient_evaluation_form_id === form.id,
                ) ?? []

              return (
                <Stack
                  key={form.id}
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={3}
                  alignItems="stretch"
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" gutterBottom>
                      {form.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Avaliação em {formatDate(form.evaluation_date)}
                    </Typography>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        {fields.length === 0 ? (
                          <Typography color="text.secondary">
                            Ficha sem campos preenchidos.
                          </Typography>
                        ) : (
                          fields.map((field) => (
                            <Box key={field.id} sx={{ mb: 1.5 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                {field.label}
                              </Typography>
                              <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                {answers[field.label]?.trim() || '—'}
                              </Typography>
                            </Box>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" gutterBottom>
                      Evolução vinculada
                    </Typography>
                    {!linkedEvolution.length ? (
                      <Typography color="text.secondary">
                        Sem registos de evolução para esta ficha.
                      </Typography>
                    ) : (
                      <Stack spacing={2}>
                        {linkedEvolution.map((row, index) => {
                          const isLatest = index === 0
                          return (
                            <Card
                              key={row.id}
                              variant="outlined"
                              sx={{
                                borderColor: isLatest ? 'primary.main' : undefined,
                              }}
                            >
                              <CardContent>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                  sx={{ mb: 1 }}
                                >
                                  <Typography variant="subtitle1">
                                    {row.entry_date}
                                  </Typography>
                                  {isLatest ? (
                                    <Chip
                                      size="small"
                                      color="primary"
                                      label="Mais recente"
                                    />
                                  ) : null}
                                </Stack>
                                <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                  {row.content}
                                </Typography>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </Stack>
                    )}
                  </Box>
                </Stack>
              )
            })
          )}
        </Stack>
      ) : null}
    </Box>
  )
}
