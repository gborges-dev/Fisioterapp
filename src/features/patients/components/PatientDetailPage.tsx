import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import { Link, useParams } from 'react-router-dom'

import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { usePatient } from '../hooks/usePatients'

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError, error } = usePatient(id)

  return (
    <Box>
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
          <Typography color="text.secondary" gutterBottom>
            {data.email || 'Sem email'} · {data.phone || 'Sem telefone'}
          </Typography>
          {data.notes ? (
            <Typography sx={{ my: 2 }}>{data.notes}</Typography>
          ) : null}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
            <Button variant="outlined" component={Link} to={`/patients/${data.id}/edit`}>
              Editar
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
