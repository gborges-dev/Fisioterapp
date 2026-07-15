import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
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
import { ApiConfigAlert } from '../../../components/ApiConfigAlert'
import { useToast } from '../../../components/toast'
import { validateRequiredFields } from '../../../lib/formFieldValidation'
import type { FormFieldSchema } from '../../../types/database.types'
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

  const handleTemplateChange = (e: SelectChangeEvent) => {
    const nextId = e.target.value
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
    return <Alert severity="error">Paciente inválido.</Alert>
  }

  return (
    <Box>
      <PageBreadcrumbs
        items={[
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
      />
      <Typography variant="h4" component="h2" gutterBottom>
        Adicionar ficha de avaliação
      </Typography>
      <ApiConfigAlert />

      {loadingTemplates ? <CircularProgress /> : null}
      {templates && templates.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Não existem modelos de ficha.{' '}
          <Link to="/evaluation-forms/new">Crie um modelo</Link> antes de adicionar
          fichas ao paciente.
        </Alert>
      ) : null}

      <Box
        component="form"
        onSubmit={(e) => void handleSubmit(e)}
        noValidate
        sx={{ maxWidth: { xs: '100%', sm: 640 } }}
      >
        <Stack spacing={2}>
          <FormControl fullWidth required>
            <InputLabel id="template-label">Modelo de ficha</InputLabel>
            <Select
              labelId="template-label"
              label="Modelo de ficha"
              value={templateId}
              onChange={handleTemplateChange}
            >
              <MenuItem value="">
                <em>Selecionar modelo…</em>
              </MenuItem>
              {(templates ?? []).map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            type="date"
            label="Data da avaliação"
            value={evaluationDate}
            onChange={(e) => setEvaluationDate(e.target.value)}
            fullWidth
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />

          {selectedTemplate ? (
            <>
              {selectedTemplate.description?.trim() ? (
                <Typography variant="body2" color="text.secondary">
                  {selectedTemplate.description}
                </Typography>
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
            <Alert severity="error">{(create.error as Error).message}</Alert>
          ) : null}

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              component={Link}
              to={`/patients/${patientId}/evaluation-forms`}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                create.isPending || !templateId || (templates?.length ?? 0) === 0
              }
            >
              Guardar ficha
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}
