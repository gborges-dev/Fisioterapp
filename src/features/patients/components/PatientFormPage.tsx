import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  type SelectChangeEvent,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { useToast } from '../../../components/toast'
import {
  usePatientHistory,
  usePatientSurgeryQuery,
  useSavePatientFicha,
  type PatientFichaHistoryInput,
  type PatientFichaSurgeryInput,
} from '../hooks/usePatientFicha'
import { usePatient } from '../hooks/usePatients'
import type { PatientHistoryRow } from '../services/patientHistoryApi'
import type { PatientSurgeryRow } from '../services/patientSurgeryApi'
import type { PatientRow } from '../services/patientsApi'
import { calculateAge } from '../utils/age'
import { isOptionalBirthDateValid } from '../utils/patientStepValidation'

const steps = ['Dados do paciente', 'Histórico', 'Dados da cirurgia'] as const

function emptyHistory(): PatientFichaHistoryInput {
  return {
    profession: null,
    smoker_status: null,
    smoking_duration: null,
    smoking_quit_duration: null,
    practices_exercise: null,
    consumes_alcohol: null,
    comorbidity: null,
    keloid_scar: null,
    observation: null,
  }
}

function emptySurgery(): PatientFichaSurgeryInput {
  return {
    surgery_type: null,
    surgeon_name: null,
    surgeon_contact_phone: null,
    post_op_duration_notes: null,
    uses_compression_garment: null,
    garment_type: null,
    uses_compression_plate: null,
    plate_type: null,
    doctor_guidance: null,
  }
}

function rowToHistory(
  row: PatientHistoryRow | null | undefined,
): PatientFichaHistoryInput {
  if (!row) return emptyHistory()
  return {
    profession: row.profession,
    smoker_status: row.smoker_status,
    smoking_duration: row.smoking_duration,
    smoking_quit_duration: row.smoking_quit_duration,
    practices_exercise: row.practices_exercise,
    consumes_alcohol: row.consumes_alcohol,
    comorbidity: row.comorbidity,
    keloid_scar: row.keloid_scar,
    observation: row.observation,
  }
}

function rowToSurgery(
  row: PatientSurgeryRow | null | undefined,
): PatientFichaSurgeryInput {
  if (!row) return emptySurgery()
  return {
    surgery_type: row.surgery_type,
    surgeon_name: row.surgeon_name,
    surgeon_contact_phone: row.surgeon_contact_phone,
    post_op_duration_notes: row.post_op_duration_notes,
    uses_compression_garment: row.uses_compression_garment,
    garment_type: row.garment_type,
    uses_compression_plate: row.uses_compression_plate,
    plate_type: row.plate_type,
    doctor_guidance: row.doctor_guidance,
  }
}

export function PatientFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const { data: existing, isLoading: loadingP, isError, error } = usePatient(
    isEdit ? id : undefined,
  )
  const { data: histRow, isLoading: loadingH } = usePatientHistory(
    isEdit ? id : undefined,
  )
  const { data: surgRow, isLoading: loadingS } = usePatientSurgeryQuery(
    isEdit ? id : undefined,
  )

  const loading = isEdit && (loadingP || loadingH || loadingS)

  if (loading) {
    return <CircularProgress aria-label="A carregar ficha" />
  }
  if (isEdit && isError) {
    return <Alert severity="error">{(error as Error).message}</Alert>
  }
  if (isEdit && !existing) {
    return <Alert severity="warning">Paciente não encontrado.</Alert>
  }

  return (
    <PatientFormWizard
      key={id ?? 'new'}
      patientId={id}
      isEdit={isEdit}
      initialPatient={isEdit ? existing! : null}
      initialHistory={isEdit ? rowToHistory(histRow) : emptyHistory()}
      initialSurgery={isEdit ? rowToSurgery(surgRow) : emptySurgery()}
    />
  )
}

function PatientFormWizard({
  patientId,
  isEdit,
  initialPatient,
  initialHistory,
  initialSurgery,
}: {
  patientId?: string
  isEdit: boolean
  initialPatient: PatientRow | null
  initialHistory: PatientFichaHistoryInput
  initialSurgery: PatientFichaSurgeryInput
}) {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const save = useSavePatientFicha()
  const [activeStep, setActiveStep] = useState(0)
  const [stepError, setStepError] = useState<string | null>(null)

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

  const [history, setHistory] = useState<PatientFichaHistoryInput>(initialHistory)
  const [surgery, setSurgery] = useState<PatientFichaSurgeryInput>(initialSurgery)

  const ageLabel = useMemo(
    () => calculateAge(birthDate),
    [birthDate],
  )

  const patchHistory = (p: Partial<PatientFichaHistoryInput>) =>
    setHistory((h) => ({ ...h, ...p }))
  const patchSurgery = (p: Partial<PatientFichaSurgeryInput>) =>
    setSurgery((s) => ({ ...s, ...p }))

  const handleNext = () => {
    if (activeStep === 0 && !isOptionalBirthDateValid(birthDate)) {
      setStepError('Data de nascimento inválida.')
      return
    }
    setStepError(null)
    setActiveStep((s) => Math.min(s + 1, steps.length - 1))
  }
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0))

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

  const handleSubmit = async () => {
    if (!fullName.trim()) return
    try {
      if (isEdit && patientId) {
        await save.mutateAsync({
          mode: 'update',
          patientId,
          patient: buildPatientPayload(),
          history,
          surgery,
        })
        showSuccess('Ficha guardada com sucesso.')
        void navigate(`/patients/${patientId}`)
      } else {
        const created = await save.mutateAsync({
          mode: 'create',
          patient: buildPatientPayload(),
          history,
          surgery,
        })
        showSuccess('Ficha guardada com sucesso.')
        void navigate(`/patients/${created.patientId}`)
      }
    } catch (e) {
      showError(e instanceof Error ? e : new Error(String(e)))
    }
  }

  const err = save.error

  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom>
        {isEdit ? 'Editar ficha de avaliação' : 'Nova ficha de avaliação'}
      </Typography>
      <SupabaseConfigAlert />
      {err ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(err as Error).message}
        </Alert>
      ) : null}
      {stepError ? (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setStepError(null)}>
          {stepError}
        </Alert>
      ) : null}

      <Stepper activeStep={activeStep} sx={{ mb: 3, display: { xs: 'none', sm: 'flex' } }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, display: { sm: 'none' } }}>
        {steps[activeStep]}
      </Typography>

      <Box sx={{ minHeight: 320 }}>
        {activeStep === 0 ? (
          <Stack spacing={2} sx={{ maxWidth: 560 }}>
            <TextField
              label="Nome completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Data de nascimento"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Idade"
                value={ageLabel != null ? String(ageLabel) : '—'}
                slotProps={{ input: { readOnly: true } }}
                fullWidth
              />
            </Stack>
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
            <TextField
              label="Telefone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
            />
            <TextField
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
            <TextField
              label="Endereço"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField label="CPF" value={cpf} onChange={(e) => setCpf(e.target.value)} fullWidth />
            <TextField
              label="Motivo da consulta"
              value={consultationReason}
              onChange={(e) => setConsultationReason(e.target.value)}
              fullWidth
              multiline
              minRows={3}
            />
            <TextField
              label="Notas"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        ) : null}

        {activeStep === 1 ? (
          <Stack spacing={2} sx={{ maxWidth: 560 }}>
            <TextField
              label="Profissão"
              value={history.profession ?? ''}
              onChange={(e) => patchHistory({ profession: e.target.value || null })}
              fullWidth
            />
            <FormControl>
              <FormLabel id="smoker-label">Fumante</FormLabel>
              <RadioGroup
                row
                aria-labelledby="smoker-label"
                value={history.smoker_status ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  patchHistory({
                    smoker_status:
                      v === '' ? null : (v as NonNullable<PatientFichaHistoryInput['smoker_status']>),
                  })
                }}
              >
                <FormControlLabel value="never" control={<Radio />} label="Nunca fumou" />
                <FormControlLabel value="ex" control={<Radio />} label="Ex-fumante" />
                <FormControlLabel value="current" control={<Radio />} label="Fumante atual" />
                <FormControlLabel value="" control={<Radio />} label="Não indicado" />
              </RadioGroup>
            </FormControl>
            <TextField
              label="Tempo de uso (tabaco)"
              value={history.smoking_duration ?? ''}
              onChange={(e) =>
                patchHistory({ smoking_duration: e.target.value || null })
              }
              fullWidth
            />
            <TextField
              label="Tempo que parou"
              value={history.smoking_quit_duration ?? ''}
              onChange={(e) =>
                patchHistory({ smoking_quit_duration: e.target.value || null })
              }
              fullWidth
              disabled={history.smoker_status !== 'ex'}
            />
            <FormControl>
              <FormLabel id="ex-label">Pratica exercício físico</FormLabel>
              <RadioGroup
                row
                aria-labelledby="ex-label"
                value={
                  history.practices_exercise === null || history.practices_exercise === undefined
                    ? ''
                    : history.practices_exercise
                      ? 'yes'
                      : 'no'
                }
                onChange={(e) => {
                  const v = e.target.value
                  patchHistory({
                    practices_exercise: v === '' ? null : v === 'yes',
                  })
                }}
              >
                <FormControlLabel value="yes" control={<Radio />} label="Sim" />
                <FormControlLabel value="no" control={<Radio />} label="Não" />
                <FormControlLabel value="" control={<Radio />} label="Não indicado" />
              </RadioGroup>
            </FormControl>
            <FormControl>
              <FormLabel id="alc-label">Bebida alcoólica</FormLabel>
              <RadioGroup
                row
                aria-labelledby="alc-label"
                value={
                  history.consumes_alcohol === null || history.consumes_alcohol === undefined
                    ? ''
                    : history.consumes_alcohol
                      ? 'yes'
                      : 'no'
                }
                onChange={(e) => {
                  const v = e.target.value
                  patchHistory({
                    consumes_alcohol: v === '' ? null : v === 'yes',
                  })
                }}
              >
                <FormControlLabel value="yes" control={<Radio />} label="Sim" />
                <FormControlLabel value="no" control={<Radio />} label="Não" />
                <FormControlLabel value="" control={<Radio />} label="Não indicado" />
              </RadioGroup>
            </FormControl>
            <TextField
              label="Comorbidades"
              value={history.comorbidity ?? ''}
              onChange={(e) => patchHistory({ comorbidity: e.target.value || null })}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Cicatriz quelóide"
              value={history.keloid_scar ?? ''}
              onChange={(e) => patchHistory({ keloid_scar: e.target.value || null })}
              fullWidth
            />
            <TextField
              label="Observação"
              value={history.observation ?? ''}
              onChange={(e) => patchHistory({ observation: e.target.value || null })}
              fullWidth
              multiline
              minRows={3}
            />
          </Stack>
        ) : null}

        {activeStep === 2 ? (
          <Stack spacing={2} sx={{ maxWidth: 560 }}>
            <TextField
              label="Tipo de cirurgia"
              value={surgery.surgery_type ?? ''}
              onChange={(e) =>
                patchSurgery({ surgery_type: e.target.value || null })
              }
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Nome do cirurgião"
              value={surgery.surgeon_name ?? ''}
              onChange={(e) =>
                patchSurgery({ surgeon_name: e.target.value || null })
              }
              fullWidth
            />
            <TextField
              label="Telefone de contato (cirurgião)"
              value={surgery.surgeon_contact_phone ?? ''}
              onChange={(e) =>
                patchSurgery({ surgeon_contact_phone: e.target.value || null })
              }
              fullWidth
            />
            <TextField
              label="Tempo de uso / notas pós-operatórias"
              value={surgery.post_op_duration_notes ?? ''}
              onChange={(e) =>
                patchSurgery({ post_op_duration_notes: e.target.value || null })
              }
              fullWidth
              multiline
              minRows={2}
            />
            <FormControl>
              <FormLabel>Uso de malhas</FormLabel>
              <RadioGroup
                row
                value={
                  surgery.uses_compression_garment === null ||
                  surgery.uses_compression_garment === undefined
                    ? ''
                    : surgery.uses_compression_garment
                      ? 'yes'
                      : 'no'
                }
                onChange={(e) => {
                  const v = e.target.value
                  patchSurgery({
                    uses_compression_garment: v === '' ? null : v === 'yes',
                    garment_type: v === 'no' || v === '' ? null : surgery.garment_type,
                  })
                }}
              >
                <FormControlLabel value="yes" control={<Radio />} label="Sim" />
                <FormControlLabel value="no" control={<Radio />} label="Não" />
                <FormControlLabel value="" control={<Radio />} label="Não indicado" />
              </RadioGroup>
            </FormControl>
            <TextField
              label="Tipo de malha"
              value={surgery.garment_type ?? ''}
              onChange={(e) =>
                patchSurgery({ garment_type: e.target.value || null })
              }
              fullWidth
              disabled={surgery.uses_compression_garment !== true}
            />
            <FormControl>
              <FormLabel>Uso de placa</FormLabel>
              <RadioGroup
                row
                value={
                  surgery.uses_compression_plate === null ||
                  surgery.uses_compression_plate === undefined
                    ? ''
                    : surgery.uses_compression_plate
                      ? 'yes'
                      : 'no'
                }
                onChange={(e) => {
                  const v = e.target.value
                  patchSurgery({
                    uses_compression_plate: v === '' ? null : v === 'yes',
                    plate_type: v === 'no' || v === '' ? null : surgery.plate_type,
                  })
                }}
              >
                <FormControlLabel value="yes" control={<Radio />} label="Sim" />
                <FormControlLabel value="no" control={<Radio />} label="Não" />
                <FormControlLabel value="" control={<Radio />} label="Não indicado" />
              </RadioGroup>
            </FormControl>
            <TextField
              label="Tipo de placa"
              value={surgery.plate_type ?? ''}
              onChange={(e) =>
                patchSurgery({ plate_type: e.target.value || null })
              }
              fullWidth
              disabled={surgery.uses_compression_plate !== true}
            />
            <TextField
              label="Orientação do médico"
              value={surgery.doctor_guidance ?? ''}
              onChange={(e) =>
                patchSurgery({ doctor_guidance: e.target.value || null })
              }
              fullWidth
              multiline
              minRows={3}
            />
          </Stack>
        ) : null}
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mt: 3 }}
        justifyContent="space-between"
      >
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Anterior
        </Button>
        <Stack direction="row" spacing={2}>
          <Button component={Link} to={isEdit && patientId ? `/patients/${patientId}` : '/patients'}>
            Cancelar
          </Button>
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={handleNext}>
              Seguinte
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => void handleSubmit()}
              disabled={save.isPending || !fullName.trim()}
            >
              Guardar ficha
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  )
}
