import { ArrowLeft, Loader2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { GlassPanel, PageHeader } from '@/components/AppShell'
import { RichTextContent } from '@/components/RichTextContent'
import { ApiConfigAlert } from '@/components/ApiConfigAlert'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { usePatientEvaluationForms } from '../../evaluation-forms/hooks/usePatientEvaluationForms'
import {
  parseAnswers,
  parseEvaluationSchema,
} from '../../evaluation-forms/services/evaluationFormsApi'
import { useEvolutionEntries } from '../../evolution/hooks/useEvolution'
import { usePatient } from '../hooks/usePatients'

function formatDate(iso: string) {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function PatientComparePage() {
  const { id } = useParams<{ id: string }>()
  const { data: patient, isLoading: lp, isError: ep, error: errP } =
    usePatient(id)
  const { data: forms, isLoading: lf } = usePatientEvaluationForms(id)
  const { data: evo, isLoading: le, isError: ee, error: errE } =
    useEvolutionEntries(id)

  const loading = lp || le || lf

  if (!id) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Paciente inválido.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Painel', to: '/' },
          { label: 'Pacientes', to: '/patients' },
          ...(patient
            ? [
                { label: patient.full_name, to: `/patients/${id}` },
                { label: 'Ficha vs evolução' },
              ]
            : [{ label: 'Comparar' }]),
        ]}
        title="Ficha vs evolução"
        actions={
          <Button variant="outline" asChild>
            <Link to={`/patients/${id}`}>
              <ArrowLeft className="h-4 w-4" />
              Voltar ao paciente
            </Link>
          </Button>
        }
      />

      <ApiConfigAlert />

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : null}
      {ep ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{(errP as Error).message}</AlertDescription>
        </Alert>
      ) : null}
      {ee ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{(errE as Error).message}</AlertDescription>
        </Alert>
      ) : null}
      {patient ? (
        <div className="space-y-6">
          {!forms?.length ? (
            <Alert>
              <AlertDescription>
                Este paciente ainda não tem fichas de avaliação.{' '}
                <Link
                  to={`/patients/${id}/evaluation-forms/new`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Adicionar ficha
                </Link>
              </AlertDescription>
            </Alert>
          ) : (
            forms.map((form) => {
              const fields = parseEvaluationSchema(form.schema)
              const answers = parseAnswers(form.answers)
              const linkedEvolution =
                evo?.filter(
                  (row) => row.patient_evaluation_form_id === form.id,
                ) ?? []

              return (
                <div
                  key={form.id}
                  className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2"
                >
                  <div className="min-w-0">
                    <h2 className="display text-lg font-semibold">{form.title}</h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Avaliação em {formatDate(form.evaluation_date)}
                    </p>
                    <GlassPanel>
                      {fields.length === 0 ? (
                        <p className="text-muted-foreground">
                          Ficha sem campos preenchidos.
                        </p>
                      ) : (
                        fields.map((field) => (
                          <div key={field.id} className="mb-3 last:mb-0">
                            <p className="text-sm font-medium text-muted-foreground">
                              {field.label}
                            </p>
                            <p className="whitespace-pre-wrap">
                              {answers[field.label]?.trim() || '—'}
                            </p>
                          </div>
                        ))
                      )}
                    </GlassPanel>
                  </div>
                  <div className="min-w-0">
                    <h2 className="display mb-4 text-lg font-semibold">
                      Evolução vinculada
                    </h2>
                    {!linkedEvolution.length ? (
                      <p className="text-muted-foreground">
                        Sem registos de evolução para esta ficha.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {linkedEvolution.map((row, index) => {
                          const isLatest = index === 0
                          return (
                            <GlassPanel
                              key={row.id}
                              className={cn(isLatest && 'ring-2 ring-primary')}
                            >
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <p className="font-semibold">{row.entry_date}</p>
                                {isLatest ? (
                                  <Badge>Mais recente</Badge>
                                ) : null}
                              </div>
                              <RichTextContent
                                content={row.content}
                                variant="body2"
                              />
                            </GlassPanel>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : null}
    </div>
  )
}
