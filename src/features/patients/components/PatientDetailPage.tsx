import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { PageBreadcrumbs } from '../../../components/PageBreadcrumbs'
import { ApiConfigAlert } from '../../../components/ApiConfigAlert'
import { DocumentsPanel } from '../../documents/components/DocumentsPanel'
import { PatientEvaluationFormsPanel } from '../../evaluation-forms/components/PatientEvaluationFormsPanel'
import { EvolutionPanel } from '../../evolution/components/EvolutionPanel'
import { usePatient } from '../hooks/usePatients'
import {
  PATIENT_TABS,
  parsePatientTab,
  type PatientTab,
} from '../patientTabs'
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

const TAB_LABELS: Record<PatientTab, string> = {
  dados: 'Dados',
  fichas: 'Fichas de avaliação',
  evolucao: 'Evolução',
  documentos: 'Documentos',
}

function PatientDadosPanel({
  data,
}: {
  data: NonNullable<ReturnType<typeof usePatient>['data']>
}) {
  return (
    <Box>
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
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Button
          variant="outlined"
          component={Link}
          to={`/patients/${data.id}/edit`}
        >
          Editar paciente
        </Button>
        <Button component={Link} to="/patients">
          Voltar à lista
        </Button>
      </Stack>
    </Box>
  )
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { data, isLoading, isError, error } = usePatient(id)
  const activeTab = parsePatientTab(searchParams)

  const handleTabChange = (_: React.SyntheticEvent, value: PatientTab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === 'dados') next.delete('tab')
        else next.set('tab', value)
        return next
      },
      { replace: true },
    )
  }

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
      <ApiConfigAlert />
      {isLoading ? <CircularProgress /> : null}
      {isError ? (
        <Alert severity="error">{(error as Error).message}</Alert>
      ) : null}
      {data ? (
        <>
          <Typography variant="h4" component="h2" gutterBottom>
            {data.full_name}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column-reverse' : 'column',
              gap: 2,
              mt: 1,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant={isMobile ? 'scrollable' : 'standard'}
              scrollButtons="auto"
              allowScrollButtonsMobile
              aria-label="Secções do paciente"
            >
              {PATIENT_TABS.map((tab) => (
                <Tab key={tab} value={tab} label={TAB_LABELS[tab]} />
              ))}
            </Tabs>

            <Box role="tabpanel">
              {activeTab === 'dados' ? <PatientDadosPanel data={data} /> : null}
              {activeTab === 'fichas' ? (
                <PatientEvaluationFormsPanel patientId={data.id} />
              ) : null}
              {activeTab === 'evolucao' ? (
                <EvolutionPanel patientId={data.id} />
              ) : null}
              {activeTab === 'documentos' ? (
                <DocumentsPanel patientId={data.id} />
              ) : null}
            </Box>
          </Box>
        </>
      ) : null}
    </Box>
  )
}
