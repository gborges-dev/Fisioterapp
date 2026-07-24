import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { PageHeader } from '@/components/AppShell'
import { ApiConfigAlert } from '@/components/ApiConfigAlert'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/toast'
import { validateRequiredFields } from '@/lib/formFieldValidation'
import type { FormFieldSchema } from '@/types/database.types'
import { usePatient } from '../../patients/hooks/usePatients'
import { patientTabPath } from '../../patients/patientTabs'
import { EvaluationFormFieldsRenderer } from './EvaluationFormFieldsRenderer'
import { useEvaluationFormTemplates } from '../hooks/useEvaluationFormTemplates'
import { useCreatePatientEvaluationForm } from '../hooks/usePatientEvaluationForms'
import { parseEvaluationSchema } from '../services/evaluationFormsApi'

export function PatientEvaluationFormCreatePage() {
  const { id: patientId } = useParams<{ id: string }>()
  const { data: patient } = usePatient(patientId)
  const { data: templates, isLoading: loadingTemplates } = useEvaluationFormTemplates()
  const create = useCreatePatientEvaluationForm(patientId ?? '')
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()

  const [templateId, setTemplateId] = useState('')
  const [evaluationDate, setEvaluationDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  )
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const selectedTemplate = useMemo(
    () => templates?.find((t) => t.id === templateId),
    [templates, templateId],
  )

  const fields: FormFieldSchema[] = useMemo(
    () =>
      selectedTemplate
        ? parseEvaluationSchema(selectedTemplate.schema)
        : [],
    [selectedTemplate],
  )

  const handleTemplateChange = (nextId: string) => {
    setTemplateId(nextId)
    setAnswers({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId || !selectedTemplate) return

    const validationError = validateRequiredFields(fields, answers)
    if (validationError) {
      showError(new Error(validationError))
      return
    }

    const answersByLabel: Record<string, string> = {}
    for (const f of fields) {
      answersByLabel[f.label] = answers[f.id] ?? ''
    }

    try {
      await create.mutateAsync({
        templateId: selectedTemplate.id,
        title: selectedTemplate.title,
        schema: fields,
        answers: answersByLabel,
        evaluationDate,
      })
      showSuccess('Ficha adicionada com sucesso.')
      void navigate(patientTabPath(patientId, 'evolucao'))
    } catch (err) {
      showError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  if (!patientId) {
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
                { label: patient.full_name, to: `/patients/${patientId}` },
                {
                  label: 'Fichas de avaliação',
                  to: `/patients/${patientId}/evaluation-forms`,
                },
                { label: 'Nova ficha' },
              ]
            : [{ label: 'Nova ficha' }]),
        ]}
        title="Adicionar ficha de avaliação"
      />
      <ApiConfigAlert />

      {loadingTemplates ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : null}
      {templates && templates.length === 0 ? (
        <Alert className="mb-4">
          <AlertDescription>
            Não existem modelos de ficha.{' '}
            <Link to="/evaluation-forms/new" className="text-primary underline">
              Crie um modelo
            </Link>{' '}
            antes de adicionar fichas ao paciente.
          </AlertDescription>
        </Alert>
      ) : null}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        noValidate
        className="max-w-xl space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="template-select">Modelo de ficha</Label>
          <Select
            value={templateId || undefined}
            onValueChange={handleTemplateChange}
            required
          >
            <SelectTrigger id="template-select">
              <SelectValue placeholder="Selecionar modelo…" />
            </SelectTrigger>
            <SelectContent>
              {(templates ?? []).map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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

        {selectedTemplate ? (
          <>
            {selectedTemplate.description?.trim() ? (
              <p className="text-sm text-muted-foreground">
                {selectedTemplate.description}
              </p>
            ) : null}
            <EvaluationFormFieldsRenderer
              fields={fields}
              answers={answers}
              onChange={(fieldId, value) =>
                setAnswers((prev) => ({ ...prev, [fieldId]: value }))
              }
            />
          </>
        ) : null}

        {create.error ? (
          <Alert variant="destructive">
            <AlertDescription>{(create.error as Error).message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" asChild>
            <Link to={`/patients/${patientId}/evaluation-forms`}>Cancelar</Link>
          </Button>
          <Button
            type="submit"
            disabled={
              create.isPending || !templateId || (templates?.length ?? 0) === 0
            }
          >
            Guardar ficha
          </Button>
        </div>
      </form>
    </div>
  )
}
