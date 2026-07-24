import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { PageHeader } from '@/components/AppShell'
import { ApiConfigAlert } from '@/components/ApiConfigAlert'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/toast'
import { validateRequiredFields } from '@/lib/formFieldValidation'
import type { FormFieldSchema } from '@/types/database.types'
import { usePatient } from '../../patients/hooks/usePatients'
import { patientTabPath } from '../../patients/patientTabs'
import { EvaluationFormFieldsRenderer } from './EvaluationFormFieldsRenderer'
import {
  usePatientEvaluationForm,
  useUpdatePatientEvaluationForm,
} from '../hooks/usePatientEvaluationForms'
import {
  parseAnswers,
  parseEvaluationSchema,
} from '../services/evaluationFormsApi'
import type { PatientEvaluationFormRow } from '../types'

function answersToFieldIds(
  fields: FormFieldSchema[],
  answersByLabel: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const f of fields) {
    out[f.id] = answersByLabel[f.label] ?? ''
  }
  return out
}

function fieldIdsToAnswers(
  fields: FormFieldSchema[],
  answersById: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const f of fields) {
    out[f.label] = answersById[f.id] ?? ''
  }
  return out
}

export function PatientEvaluationFormDetailPage() {
  const { id: patientId, formId } = useParams<{ id: string; formId: string }>()
  const { data: patient } = usePatient(patientId)
  const { data: form, isLoading, isError, error } = usePatientEvaluationForm(
    patientId,
    formId,
  )

  if (!patientId || !formId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Ficha inválida.</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  }
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{(error as Error).message}</AlertDescription>
      </Alert>
    )
  }
  if (!form) {
    return (
      <Alert variant="warning">
        <AlertDescription>Ficha não encontrada.</AlertDescription>
      </Alert>
    )
  }

  return (
    <PatientEvaluationFormEditor
      key={form.id}
      patientId={patientId}
      patientName={patient?.full_name}
      form={form}
    />
  )
}

function PatientEvaluationFormEditor({
  patientId,
  patientName,
  form,
}: {
  patientId: string
  patientName?: string
  form: PatientEvaluationFormRow
}) {
  const update = useUpdatePatientEvaluationForm(patientId)
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()

  const fields = useMemo(() => parseEvaluationSchema(form.schema), [form.schema])

  const [evaluationDate, setEvaluationDate] = useState(() =>
    form.evaluation_date.slice(0, 10),
  )
  const [answers, setAnswers] = useState(() => {
    const byLabel = parseAnswers(form.answers)
    return answersToFieldIds(fields, byLabel)
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateRequiredFields(fields, answers)
    if (validationError) {
      showError(new Error(validationError))
      return
    }

    try {
      await update.mutateAsync({
        formId: form.id,
        answers: fieldIdsToAnswers(fields, answers),
        evaluationDate,
      })
      showSuccess('Ficha atualizada.')
      void navigate(patientTabPath(patientId, 'evolucao'))
    } catch (err) {
      showError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: 'Painel', to: '/' },
          { label: 'Pacientes', to: '/patients' },
          ...(patientName
            ? [
                { label: patientName, to: `/patients/${patientId}` },
                {
                  label: 'Fichas de avaliação',
                  to: `/patients/${patientId}/evaluation-forms`,
                },
                { label: form.title },
              ]
            : [{ label: form.title }]),
        ]}
        title={form.title}
        actions={
          <Button variant="outline" asChild>
            <Link to={`/patients/${patientId}/evaluation-forms`}>Voltar às fichas</Link>
          </Button>
        }
      />
      <ApiConfigAlert />

      <form
        onSubmit={(e) => void handleSubmit(e)}
        noValidate
        className="max-w-xl space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="evaluation-date">Data da avaliação</Label>
          <Input
            id="evaluation-date"
            type="date"
            value={evaluationDate}
            onChange={(e) => setEvaluationDate(e.target.value)}
            required
          />
        </div>
        <EvaluationFormFieldsRenderer
          fields={fields}
          answers={answers}
          onChange={(fieldId, value) =>
            setAnswers((prev) => ({ ...prev, [fieldId]: value }))
          }
        />
        {update.error ? (
          <Alert variant="destructive">
            <AlertDescription>{(update.error as Error).message}</AlertDescription>
          </Alert>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" asChild>
            <Link to={`/patients/${patientId}/evaluation-forms`}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={update.isPending}>
            Guardar alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
