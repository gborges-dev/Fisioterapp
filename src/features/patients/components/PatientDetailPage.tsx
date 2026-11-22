import { Loader2, Plus } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { GlassPanel, PageHeader } from '@/components/AppShell'
import { ApiConfigAlert } from '@/components/ApiConfigAlert'
import { QueryErrorState } from '@/components/QueryErrorState'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DocumentsPanel } from '../../documents/components/DocumentsPanel'
import { PatientEvaluationFormsPanel } from '../../evaluation-forms/components/PatientEvaluationFormsPanel'
import { EvolutionPanel } from '../../evolution/components/EvolutionPanel'
import { usePatient } from '../hooks/usePatients'
import {
  PATIENT_TABS,
  parsePatientTab,
  patientTabPath,
  type PatientTab,
} from '../patientTabs'
import { calculateAge } from '../utils/age'
import { patientInitials } from '../utils/initials'

type PatientData = NonNullable<ReturnType<typeof usePatient>['data']>

function Field({
  label,
  value,
  wide,
}: {
  label: string
  value: string | null | undefined
  wide?: boolean
}) {
  const v = value?.trim()
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap font-medium">{v || '—'}</dd>
    </div>
  )
}

function patientMeta(data: PatientData | null | undefined): string | undefined {
  if (!data) return undefined
  const birth = data.birth_date?.slice(0, 10)
  const age = birth ? calculateAge(birth) : null
  return [
    age != null ? `${age} anos` : null,
    data.sex ? sexPt(data.sex) : null,
    data.phone?.trim() || null,
  ]
    .filter(Boolean)
    .join(' · ') || undefined
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

function PatientDadosPanel({ data }: { data: PatientData }) {
  const birth = data.birth_date?.slice(0, 10)
  const age = birth ? calculateAge(birth) : null
  return (
    <div className="flex flex-wrap items-start gap-5">
      <GlassPanel className="min-w-0 flex-[3_1_460px] p-7">
        <h2 className="display mb-5 text-2xl font-semibold leading-[30px]">
          Dados pessoais
        </h2>
        <dl className="grid grid-cols-1 gap-x-7 gap-y-5 sm:grid-cols-2">
          <Field
            label="Data de nascimento"
            value={
              birth ? new Date(`${birth}T12:00:00`).toLocaleDateString('pt-BR') : null
            }
          />
          <Field label="Idade" value={age != null ? `${age} anos` : null} />
          <Field label="Sexo" value={sexPt(data.sex)} />
          <Field label="CPF" value={data.cpf} />
          <Field label="Telefone" value={data.phone} />
          <Field label="E-mail" value={data.email} />
          <Field label="Endereço" value={data.address} wide />
        </dl>
      </GlassPanel>
      <div className="flex min-w-0 flex-[2_1_320px] flex-col gap-5">
        <GlassPanel className="p-7">
          <h2 className="display mb-2.5 text-2xl font-semibold leading-[30px]">
            Motivo da consulta
          </h2>
          <p className="whitespace-pre-wrap">{data.consultation_reason?.trim() || '—'}</p>
        </GlassPanel>
        <GlassPanel className="p-7">
          <h2 className="display mb-2.5 text-2xl font-semibold leading-[30px]">Notas</h2>
          <p className="whitespace-pre-wrap">{data.notes?.trim() || '—'}</p>
        </GlassPanel>
      </div>
    </div>
  )
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data, isLoading, isError, error, refetch } = usePatient(id)
  const activeTab = parsePatientTab(searchParams)

  const handleTabChange = (value: PatientTab) => {
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
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Painel', to: '/' },
          { label: 'Pacientes', to: '/patients' },
          ...(data
            ? [{ label: data.full_name }]
            : [{ label: 'Paciente' }]),
        ]}
        title={data?.full_name ?? 'Paciente'}
        subtitle={patientMeta(data)}
        leading={
          data ? (
            <span
              className="hidden h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-accent text-[28px] font-semibold text-accent-foreground display sm:flex"
              aria-hidden
            >
              {patientInitials(data.full_name)}
            </span>
          ) : null
        }
        actions={
          data ? (
            <>
              <Button variant="outline" asChild>
                <Link to={`/patients/${data.id}/edit`}>Editar paciente</Link>
              </Button>
              <Button asChild>
                <Link to={patientTabPath(data.id, 'evolucao')}>
                  <Plus />
                  Nova evolução
                </Link>
              </Button>
            </>
          ) : null
        }
      />

      <ApiConfigAlert />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : null}
      {isError ? (
        <QueryErrorState
          error={error}
          title="Não foi possível abrir o paciente"
          onRetry={() => void refetch()}
          backTo={{ label: 'Voltar à lista', href: '/patients' }}
        />
      ) : null}
      {data ? (
        <Tabs
          value={activeTab}
          onValueChange={(value) => handleTabChange(value as PatientTab)}
          className="mt-2"
        >
          <div className="flex flex-col-reverse gap-5 md:flex-col">
            <TabsList
              className="w-full justify-start self-start overflow-x-auto md:w-auto"
              aria-label="Secções do paciente"
            >
              {PATIENT_TABS.map((tab) => (
                <TabsTrigger key={tab} value={tab} className="shrink-0">
                  {TAB_LABELS[tab]}
                </TabsTrigger>
              ))}
            </TabsList>

            <div role="tabpanel">
              <TabsContent value="dados" className="mt-0">
                <PatientDadosPanel data={data} />
              </TabsContent>
              <TabsContent value="fichas" className="mt-0">
                <PatientEvaluationFormsPanel patientId={data.id} />
              </TabsContent>
              <TabsContent value="evolucao" className="mt-0">
                <EvolutionPanel patientId={data.id} />
              </TabsContent>
              <TabsContent value="documentos" className="mt-0">
                <DocumentsPanel patientId={data.id} />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      ) : null}
    </div>
  )
}
