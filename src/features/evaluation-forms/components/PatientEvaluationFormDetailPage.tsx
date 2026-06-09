import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { PageBreadcrumbs } from '../../../components/PageBreadcrumbs'
import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { useToast } from '../../../components/toast'
import type { FormFieldSchema } from '../../../types/database.types'
import { usePatient } from '../../patients/hooks/usePatients'
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
    return <Alert severity="error">Ficha inválida.</Alert>
  }

  if (isLoading) {
    return <CircularProgress />
  }
  if (isError) {
    return <Alert severity="error">{(error as Error).message}</Alert>
  }
  if (!form) {
    return <Alert severity="warning">Ficha não encontrada.</Alert>
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

    for (const f of fields) {
      if (f.required && !answers[f.id]?.trim()) {
        showError(new Error(`O campo "${f.label}" é obrigatório.`))
        return
      }
    }

    try {
      await update.mutateAsync({
        formId: form.id,
        answers: fieldIdsToAnswers(fields, answers),
        evaluationDate,
      })
      showSuccess('Ficha atualizada.')
    } catch (err) {
      showError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return (
    <Box>
      <PageBreadcrumbs
        items={[
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
      />
      <Typography variant="h4" component="h2" gutterBottom>
        {form.title}
      </Typography>
      <Button
        component={Link}
        to={`/patients/${patientId}/evaluation-forms`}
        sx={{ mb: 2 }}
      >
        Voltar às fichas
      </Button>
      <SupabaseConfigAlert />

      <Box
        component="form"
        onSubmit={(e) => void handleSubmit(e)}
        noValidate
        sx={{ maxWidth: 640 }}
      >
        <Stack spacing={2}>
          <TextField
            type="date"
            label="Data da avaliação"
            value={evaluationDate}
            onChange={(e) => setEvaluationDate(e.target.value)}
            fullWidth
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <EvaluationFormFieldsRenderer
            fields={fields}
            answers={answers}
            onChange={(fieldId, value) =>
              setAnswers((prev) => ({ ...prev, [fieldId]: value }))
            }
          />
          {update.error ? (
            <Alert severity="error">{(update.error as Error).message}</Alert>
          ) : null}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              component={Link}
              to={`/patients/${patientId}/evaluation-forms`}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={update.isPending}>
              Guardar alterações
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}
