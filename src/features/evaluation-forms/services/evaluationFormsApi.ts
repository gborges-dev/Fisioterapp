import { apiRequest } from '../../../lib/apiClient'
import type { Database, FormFieldSchema, Json } from '../../../types/database.types'
import { getActiveWorkspaceId } from '../../auth/authStorage'
import { parseFormSchema } from '../../form-builder/services/formsApi'

type EvaluationFormTemplateRow =
  Database['public']['Tables']['evaluation_form_templates']['Row']
type PatientEvaluationFormRow =
  Database['public']['Tables']['patient_evaluation_forms']['Row']
export type PatientEvaluationFormInsert =
  Database['public']['Tables']['patient_evaluation_forms']['Insert']

export async function listEvaluationFormTemplates(_workspaceId?: string) {
  return apiRequest<EvaluationFormTemplateRow[]>('/evaluation-form-templates')
}

export async function getEvaluationFormTemplate(id: string) {
  return apiRequest<EvaluationFormTemplateRow>(
    `/evaluation-form-templates/${id}`,
  )
}

export async function createEvaluationFormTemplate(
  workspaceId: string,
  title: string,
  description: string | null,
  schema: FormFieldSchema[],
) {
  return apiRequest<EvaluationFormTemplateRow>('/evaluation-form-templates', {
    method: 'POST',
    body: JSON.stringify({
      workspace_id: workspaceId,
      title,
      description,
      schema,
    }),
    workspaceId: workspaceId || getActiveWorkspaceId(),
  })
}

export async function updateEvaluationFormTemplate(
  id: string,
  title: string,
  description: string | null,
  schema: FormFieldSchema[],
) {
  return apiRequest<EvaluationFormTemplateRow>(
    `/evaluation-form-templates/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ title, description, schema }),
    },
  )
}

export async function deleteEvaluationFormTemplate(id: string) {
  return apiRequest<{ ok: boolean }>(`/evaluation-form-templates/${id}`, {
    method: 'DELETE',
  })
}

export async function listPatientEvaluationForms(patientId: string) {
  return apiRequest<PatientEvaluationFormRow[]>(
    `/patients/${patientId}/evaluation-forms`,
  )
}

export async function getPatientEvaluationForm(id: string) {
  return apiRequest<PatientEvaluationFormRow>(
    `/patient-evaluation-forms/${id}`,
  )
}

export async function createPatientEvaluationForm(
  payload: Omit<PatientEvaluationFormInsert, 'workspace_id'> & {
    workspace_id?: string
  },
) {
  const { patient_id, workspace_id, ...body } = payload
  return apiRequest<PatientEvaluationFormRow>(
    `/patients/${patient_id}/evaluation-forms`,
    {
      method: 'POST',
      body: JSON.stringify(body),
      workspaceId: workspace_id ?? getActiveWorkspaceId(),
    },
  )
}

export async function updatePatientEvaluationForm(
  id: string,
  patch: {
    answers?: Json
    evaluation_date?: string
    updated_at?: string
  },
) {
  const { updated_at: _ignored, ...body } = patch
  return apiRequest<PatientEvaluationFormRow>(
    `/patient-evaluation-forms/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  )
}

export async function deletePatientEvaluationForm(id: string) {
  return apiRequest<{ ok: boolean }>(`/patient-evaluation-forms/${id}`, {
    method: 'DELETE',
  })
}

export async function countEvolutionEntriesByFormId(formId: string) {
  return apiRequest<{ count: number }>(
    `/patient-evaluation-forms/${formId}/evolution-count`,
  )
}

export function parseEvaluationSchema(raw: Json): FormFieldSchema[] {
  return parseFormSchema(raw)
}

export function parseAnswers(raw: Json): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'string') out[k] = v
    else if (v != null) out[k] = String(v)
  }
  return out
}
