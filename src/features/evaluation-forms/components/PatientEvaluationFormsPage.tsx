import AddIcon from '@mui/icons-material/Add'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { Link, useParams } from 'react-router-dom'

import { PageBreadcrumbs } from '../../../components/PageBreadcrumbs'
import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { usePatient } from '../../patients/hooks/usePatients'
import { usePatientEvaluationForms } from '../hooks/usePatientEvaluationForms'
import { parseEvaluationSchema } from '../services/evaluationFormsApi'

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

export function PatientEvaluationFormsPage() {
  const { id: patientId } = useParams<{ id: string }>()
  const { data: patient } = usePatient(patientId)
  const { data, isLoading, isError, error } = usePatientEvaluationForms(patientId)

  if (!patientId) {
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
                { label: patient.full_name, to: `/patients/${patientId}` },
                { label: 'Fichas de avaliação' },
              ]
            : [{ label: 'Fichas de avaliação' }]),
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
          to={`/patients/${patientId}/evaluation-forms/new`}
        >
          Adicionar ficha
        </Button>
      </Box>

      <Button component={Link} to={`/patients/${patientId}`} sx={{ mb: 2 }}>
        Voltar ao paciente
      </Button>
      <SupabaseConfigAlert />

      {isLoading ? <CircularProgress /> : null}
      {isError ? (
        <Alert severity="error">{(error as Error).message}</Alert>
      ) : null}
      {data && data.length === 0 ? (
        <Stack spacing={2}>
          <Typography color="text.secondary">
            Este paciente ainda não tem fichas de avaliação.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            component={Link}
            to={`/patients/${patientId}/evaluation-forms/new`}
            sx={{ alignSelf: 'flex-start' }}
          >
            Adicionar primeira ficha
          </Button>
        </Stack>
      ) : null}
      {data && data.length > 0 ? (
        <Grid container spacing={2}>
          {data.map((form) => {
            const fieldCount = parseEvaluationSchema(form.schema).length
            return (
              <Grid key={form.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {form.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Data: {formatDate(form.evaluation_date)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {fieldCount} campo{fieldCount !== 1 ? 's' : ''}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                    <Tooltip title="Ver ficha">
                      <IconButton
                        component={Link}
                        to={`/patients/${patientId}/evaluation-forms/${form.id}`}
                        size="small"
                        color="primary"
                        aria-label="Ver ficha"
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      ) : null}
    </Box>
  )
}
