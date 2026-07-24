import { Loader2 } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { GlassPanel, PageHeader } from '@/components/AppShell'
import { ApiConfigAlert } from '@/components/ApiConfigAlert'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    <div className="mb-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap">{v || '—'}</p>
    </div>
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
    <div>
      <GlassPanel className="mb-6">
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
      </GlassPanel>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" asChild>
          <Link to={`/patients/${data.id}/edit`}>Editar paciente</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link to="/patients">Voltar à lista</Link>
        </Button>
      </div>
    </div>
  )
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data, isLoading, isError, error } = usePatient(id)
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
      />

      <ApiConfigAlert />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : null}
      {isError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      ) : null}
      {data ? (
        <Tabs
          value={activeTab}
          onValueChange={(value) => handleTabChange(value as PatientTab)}
          className="mt-2"
        >
          <div className="flex flex-col-reverse gap-4 md:flex-col">
            <TabsList
              className="h-auto w-full justify-start overflow-x-auto"
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
