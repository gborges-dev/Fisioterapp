import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { PageBreadcrumbs } from '../../../components/PageBreadcrumbs'
import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { usePatient } from '../../patients/hooks/usePatients'
import { useCreateEvolution, useEvolutionEntries } from '../hooks/useEvolution'

export function EvolutionPage() {
  const { id: patientId } = useParams<{ id: string }>()
  const { data: patient } = usePatient(patientId)
  const { data, isLoading, isError, error } = useEvolutionEntries(patientId)
  const create = useCreateEvolution(patientId ?? '')
  const [content, setContent] = useState('')
  const [entryDate, setEntryDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId || !content.trim()) return
    try {
      await create.mutateAsync({ content: content.trim(), entryDate })
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
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mb: 3 }}>
        <Stack spacing={2} sx={{ maxWidth: 640 }}>
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
            disabled={create.isPending}
          >
            Adicionar registo
          </Button>
        </Stack>
      </Box>
      {isLoading ? <CircularProgress /> : null}
      {isError ? (
        <Alert severity="error">{(error as Error).message}</Alert>
      ) : null}
      <Stack spacing={2}>
        {data?.map((row) => (
          <Card key={row.id} variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                {row.entry_date}
              </Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{row.content}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
      {data && data.length === 0 ? (
        <Typography color="text.secondary">Sem registos ainda.</Typography>
      ) : null}
    </Box>
  )
}
