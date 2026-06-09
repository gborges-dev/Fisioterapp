import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import { Link, useParams } from 'react-router-dom'

import { PageBreadcrumbs } from '../../../components/PageBreadcrumbs'
import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { usePatient } from '../hooks/usePatients'
import { calculateAge } from '../utils/age'

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  const v = value?.trim()
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ whiteSpace: 'pre-wrap' }}>{v || '—'}</Typography>
    </Box>
  )
}

function sexPt(s: string | null | undefined) {
  if (s === 'F') return 'Feminino'
  if (s === 'M') return 'Masculino'
  if (s === 'O') return 'Outro'
  return '—'
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError, error } = usePatient(id)

  return (
    <Box>
      <PageBreadcrumbs
        items={[
          { label: 'Painel', to: '/' },
          { label: 'Pacientes', to: '/patients' },
          ...(data
            ? [{ label: data.full_name }]
            : [{ label: 'Paciente' }]),
        ]}
      />
      <SupabaseConfigAlert />
      {isLoading ? <CircularProgress /> : null}
      {isError ? (
        <Alert severity="error">{(error as Error).message}</Alert>
      ) : null}
      {data ? (
        <>
          <Typography variant="h4" component="h2" gutterBottom>
            {data.full_name}
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Field
              label="Data de nascimento"
              value={data.birth_date?.slice(0, 10) ?? null}
            />
            <Field
              label="Idade"
              value={(() => {
                const b = data.birth_date?.slice(0, 10)
                if (!b) return null
                const a = calculateAge(b)
                return a != null ? String(a) : null
              })()}
            />
            <Field label="Sexo" value={sexPt(data.sex)} />
            <Field label="Telefone" value={data.phone} />
            <Field label="E-mail" value={data.email} />
            <Field label="Endereço" value={data.address} />
            <Field label="CPF" value={data.cpf} />
            <Field label="Motivo da consulta" value={data.consultation_reason} />
            <Field label="Notas" value={data.notes} />
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
            <Button variant="outlined" component={Link} to={`/patients/${data.id}/edit`}>
              Editar paciente
            </Button>
            <Button
              variant="contained"
              component={Link}
              to={`/patients/${data.id}/evaluation-forms`}
            >
              Fichas de avaliação
            </Button>
            <Button variant="outlined" component={Link} to={`/patients/${data.id}/evolution`}>
              Evolução
            </Button>
            <Button variant="outlined" component={Link} to={`/patients/${data.id}/documents`}>
              Documentos
            </Button>
            <Button component={Link} to="/patients">
              Voltar à lista
            </Button>
          </Stack>
        </>
      ) : null}
    </Box>
  )
}
