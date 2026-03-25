import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import {
  usePatientHistory,
  usePatientSurgeryQuery,
} from '../hooks/usePatientFicha'
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

function boolPt(v: boolean | null | undefined) {
  if (v === true) return 'Sim'
  if (v === false) return 'Não'
  return '—'
}

function smokerPt(s: string | null | undefined) {
  if (s === 'never') return 'Nunca fumou'
  if (s === 'ex') return 'Ex-fumante'
  if (s === 'current') return 'Fumante atual'
  return '—'
}

function sexPt(s: string | null | undefined) {
  if (s === 'F') return 'Feminino'
  if (s === 'M') return 'Masculino'
  if (s === 'O') return 'Outro'
  return '—'
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState(0)
  const { data, isLoading, isError, error } = usePatient(id)
  const { data: hist, isLoading: lh } = usePatientHistory(id)
  const { data: surg, isLoading: ls } = usePatientSurgeryQuery(id)

  const loading = isLoading || lh || ls

  return (
    <Box>
      <SupabaseConfigAlert />
      {loading ? <CircularProgress /> : null}
      {isError ? (
        <Alert severity="error">{(error as Error).message}</Alert>
      ) : null}
      {data ? (
        <>
          <Typography variant="h4" component="h2" gutterBottom>
            {data.full_name}
          </Typography>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2 }}
          >
            <Tab label="Dados da ficha" />
            <Tab label="Histórico" />
            <Tab label="Cirurgia" />
          </Tabs>

          {tab === 0 ? (
            <Box>
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
          ) : null}

          {tab === 1 ? (
            <Box>
              <Field label="Profissão" value={hist?.profession} />
              <Field label="Fumante" value={smokerPt(hist?.smoker_status)} />
              <Field label="Tempo de uso (tabaco)" value={hist?.smoking_duration} />
              <Field label="Tempo que parou" value={hist?.smoking_quit_duration} />
              <Field
                label="Pratica exercício físico"
                value={boolPt(hist?.practices_exercise)}
              />
              <Field label="Bebida alcoólica" value={boolPt(hist?.consumes_alcohol)} />
              <Field label="Comorbidades" value={hist?.comorbidity} />
              <Field label="Cicatriz quelóide" value={hist?.keloid_scar} />
              <Field label="Observação" value={hist?.observation} />
            </Box>
          ) : null}

          {tab === 2 ? (
            <Box>
              <Field label="Tipo de cirurgia" value={surg?.surgery_type} />
              <Field label="Nome do cirurgião" value={surg?.surgeon_name} />
              <Field
                label="Telefone do cirurgião"
                value={surg?.surgeon_contact_phone}
              />
              <Field
                label="Tempo de uso / notas pós-operatórias"
                value={surg?.post_op_duration_notes}
              />
              <Field
                label="Uso de malhas"
                value={boolPt(surg?.uses_compression_garment)}
              />
              <Field label="Tipo de malha" value={surg?.garment_type} />
              <Field label="Uso de placa" value={boolPt(surg?.uses_compression_plate)} />
              <Field label="Tipo de placa" value={surg?.plate_type} />
              <Field label="Orientação do médico" value={surg?.doctor_guidance} />
            </Box>
          ) : null}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
            <Button variant="outlined" component={Link} to={`/patients/${data.id}/edit`}>
              Editar ficha
            </Button>
            <Button variant="outlined" component={Link} to={`/patients/${data.id}/comparar`}>
              Ficha vs evolução
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
