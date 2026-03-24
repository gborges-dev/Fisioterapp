import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { usePatient, usePatientMutations } from '../hooks/usePatients'
import type { PatientRow } from '../services/patientsApi'

export function PatientFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const { data: existing, isLoading, isError, error } = usePatient(
    isEdit ? id : undefined,
  )

  if (isEdit && isLoading) {
    return <CircularProgress aria-label="A carregar paciente" />
  }
  if (isEdit && isError) {
    return <Alert severity="error">{(error as Error).message}</Alert>
  }
  if (isEdit && !existing) {
    return <Alert severity="warning">Paciente não encontrado.</Alert>
  }

  return (
    <PatientFormFields
      key={id ?? 'new'}
      patientId={id}
      isEdit={isEdit}
      initial={isEdit ? existing! : null}
    />
  )
}

function PatientFormFields({
  patientId,
  isEdit,
  initial,
}: {
  patientId?: string
  isEdit: boolean
  initial: PatientRow | null
}) {
  const navigate = useNavigate()
  const { create, update } = usePatientMutations()

  const [fullName, setFullName] = useState(() => initial?.full_name ?? '')
  const [email, setEmail] = useState(() => initial?.email ?? '')
  const [phone, setPhone] = useState(() => initial?.phone ?? '')
  const [notes, setNotes] = useState(() => initial?.notes ?? '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) return

    try {
      if (isEdit && patientId) {
        await update.mutateAsync({
          id: patientId,
          payload: {
            full_name: fullName.trim(),
            email: email.trim() || null,
            phone: phone.trim() || null,
            notes: notes.trim() || null,
          },
        })
        void navigate(`/patients/${patientId}`)
      } else {
        const row = await create.mutateAsync({
          full_name: fullName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          notes: notes.trim() || null,
        })
        void navigate(`/patients/${row.id}`)
      }
    } catch {
      /* erro mostrado via isError */
    }
  }

  const pending = create.isPending || update.isPending
  const err = create.error ?? update.error

  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom>
        {isEdit ? 'Editar paciente' : 'Novo paciente'}
      </Typography>
      <SupabaseConfigAlert />
      {err ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(err as Error).message}
        </Alert>
      ) : null}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2} sx={{ maxWidth: 480 }}>
          <TextField
            label="Nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            fullWidth
            autoComplete="name"
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            autoComplete="email"
          />
          <TextField
            label="Telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
            autoComplete="tel"
          />
          <TextField
            label="Notas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
          <Stack direction="row" spacing={2}>
            <Button type="submit" variant="contained" disabled={pending}>
              Guardar
            </Button>
            <Button
              component={Link}
              to={
                isEdit && patientId ? `/patients/${patientId}` : '/patients'
              }
            >
              Cancelar
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}
