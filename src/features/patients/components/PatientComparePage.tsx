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

import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { useEvolutionEntries } from '../../evolution/hooks/useEvolution'
import {
  usePatientHistory,
  usePatientSurgeryQuery,
} from '../hooks/usePatientFicha'
import { usePatient } from '../hooks/usePatients'

export function PatientComparePage() {
  const { id } = useParams<{ id: string }>()
  const { data: patient, isLoading: lp, isError: ep, error: errP } =
    usePatient(id)
  const { data: hist } = usePatientHistory(id)
  const { data: surg } = usePatientSurgeryQuery(id)
  const { data: evo, isLoading: le, isError: ee, error: errE } =
    useEvolutionEntries(id)

  const loading = lp || le

  if (!id) {
    return <Alert severity="error">Paciente inválido.</Alert>
  }

  return (
    <Box>
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
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          alignItems="stretch"
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" gutterBottom>
              Contexto da ficha (baseline)
            </Typography>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Motivo da consulta
                </Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                  {patient.consultation_reason?.trim() || '—'}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Resumo
                </Typography>
                <Typography variant="body2">
                  {patient.birth_date
                    ? `Nasc.: ${patient.birth_date.slice(0, 10)}`
                    : null}
                </Typography>
                {hist?.comorbidity ? (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Comorbidades: {hist.comorbidity}
                  </Typography>
                ) : null}
                {surg?.surgery_type ? (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Cirurgia: {surg.surgery_type}
                  </Typography>
                ) : null}
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" gutterBottom>
              Evolução no tempo
            </Typography>
            {!evo?.length ? (
              <Typography color="text.secondary">
                Ainda não há registos de evolução.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {evo.map((row, index) => {
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
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="subtitle1">
                            {row.entry_date}
                          </Typography>
                          {isLatest ? (
                            <Chip size="small" color="primary" label="Mais recente" />
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
      ) : null}
    </Box>
  )
}
