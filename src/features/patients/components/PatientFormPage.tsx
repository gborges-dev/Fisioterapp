import {
  Alert,
  Box,
  Button,
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
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { PageBreadcrumbs } from '../../../components/PageBreadcrumbs'
import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { useToast } from '../../../components/toast'
import { useSavePatient } from '../hooks/usePatientFicha'
import { usePatient } from '../hooks/usePatients'
import type { PatientRow } from '../services/patientsApi'
import { calculateAge } from '../utils/age'
import { isOptionalBirthDateValid } from '../utils/patientStepValidation'

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
      initialPatient={isEdit ? existing! : null}
    />
  )
}

function PatientFormFields({
  patientId,
  isEdit,
  initialPatient,
}: {
  patientId?: string
  isEdit: boolean
  initialPatient: PatientRow | null
}) {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const save = useSavePatient()
  const [formError, setFormError] = useState<string | null>(null)

  const [fullName, setFullName] = useState(() => initialPatient?.full_name ?? '')
  const [birthDate, setBirthDate] = useState(
    () => initialPatient?.birth_date?.slice(0, 10) ?? '',
  )
  const [sex, setSex] = useState(() => initialPatient?.sex ?? '')
  const [phone, setPhone] = useState(() => initialPatient?.phone ?? '')
  const [email, setEmail] = useState(() => initialPatient?.email ?? '')
  const [address, setAddress] = useState(() => initialPatient?.address ?? '')
  const [cpf, setCpf] = useState(() => initialPatient?.cpf ?? '')
  const [consultationReason, setConsultationReason] = useState(
    () => initialPatient?.consultation_reason ?? '',
  )
  const [notes, setNotes] = useState(() => initialPatient?.notes ?? '')

  const ageLabel = useMemo(() => calculateAge(birthDate), [birthDate])

  const buildPatientPayload = () => ({
    full_name: fullName.trim(),
    birth_date: birthDate.trim() || null,
    sex: sex || null,
    phone: phone.trim() || null,
    email: email.trim() || null,
    address: address.trim() || null,
    cpf: cpf.trim() || null,
    consultation_reason: consultationReason.trim() || null,
    notes: notes.trim() || null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) return
    if (!isOptionalBirthDateValid(birthDate)) {
      setFormError('Data de nascimento inválida.')
      return
    }
    setFormError(null)
    try {
      if (isEdit && patientId) {
        await save.mutateAsync({
          mode: 'update',
          patientId,
          patient: buildPatientPayload(),
        })
        showSuccess('Paciente guardado com sucesso.')
        void navigate(`/patients/${patientId}`)
      } else {
        const created = await save.mutateAsync({
          mode: 'create',
          patient: buildPatientPayload(),
        })
        showSuccess('Paciente guardado com sucesso.')
        void navigate(`/patients/${created.patientId}`)
      }
    } catch (err) {
      showError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  const err = save.error

  const crumbPatient =
    isEdit && patientId
      ? [
          {
            label: fullName.trim() || 'Paciente',
            to: `/patients/${patientId}`,
          },
          { label: 'Editar paciente' },
        ]
      : [{ label: 'Novo paciente' }]

  return (
    <Box>
      <PageBreadcrumbs
        items={[
          { label: 'Painel', to: '/' },
          { label: 'Pacientes', to: '/patients' },
          ...crumbPatient,
        ]}
      />
      <Typography variant="h4" component="h2" gutterBottom>
        {isEdit ? 'Editar paciente' : 'Novo paciente'}
      </Typography>
      <SupabaseConfigAlert />
      {err ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(err as Error).message}
        </Alert>
      ) : null}
      {formError ? (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
          {formError}
        </Alert>
      ) : null}

      <Box
        component="form"
        onSubmit={(e) => void handleSubmit(e)}
        noValidate
        sx={{ maxWidth: 720 }}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Nome completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Data de nascimento"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Idade"
              value={ageLabel != null ? String(ageLabel) : '—'}
              slotProps={{ input: { readOnly: true } }}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel id="sex-label">Sexo</InputLabel>
              <Select
                labelId="sex-label"
                label="Sexo"
                value={sex}
                onChange={(e: SelectChangeEvent) => setSex(e.target.value)}
              >
                <MenuItem value="">
                  <em>Não indicado</em>
                </MenuItem>
                <MenuItem value="F">Feminino</MenuItem>
                <MenuItem value="M">Masculino</MenuItem>
                <MenuItem value="O">Outro</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="CPF"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Telefone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Endereço"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Motivo da consulta"
              value={consultationReason}
              onChange={(e) => setConsultationReason(e.target.value)}
              fullWidth
              multiline
              minRows={3}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Notas"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Grid>
        </Grid>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mt: 3 }}
          justifyContent="flex-end"
        >
          <Button
            component={Link}
            to={isEdit && patientId ? `/patients/${patientId}` : '/patients'}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={save.isPending || !fullName.trim()}
          >
            Guardar paciente
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}
