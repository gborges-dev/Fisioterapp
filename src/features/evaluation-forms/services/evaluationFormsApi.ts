import { supabase } from '../../../lib/supabaseClient'
import type { Database, FormFieldSchema, Json } from '../../../types/database.types'
import { parseFormSchema } from '../../form-builder/services/formsApi'
export type PatientEvaluationFormInsert =
  Database['public']['Tables']['patient_evaluation_forms']['Insert']

export async function listEvaluationFormTemplates(workspaceId: string) {
  return supabase
    .from('evaluation_form_templates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })
}

export async function getEvaluationFormTemplate(id: string) {
  return supabase
    .from('evaluation_form_templates')
    .select('*')
    .eq('id', id)
    .maybeSingle()
}

export async function createEvaluationFormTemplate(
  workspaceId: string,
  title: string,
  description: string | null,
  schema: FormFieldSchema[],
) {
  return supabase
    .from('evaluation_form_templates')
    .insert({
      workspace_id: workspaceId,
      title,
      description,
      schema: schema as unknown as Json,
    })
    .select()
    .single()
}

export async function updateEvaluationFormTemplate(
  id: string,
  title: string,
  description: string | null,
  schema: FormFieldSchema[],
) {
  return supabase
    .from('evaluation_form_templates')
    .update({
      title,
      description,
      schema: schema as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
}

export async function deleteEvaluationFormTemplate(id: string) {
  return supabase.from('evaluation_form_templates').delete().eq('id', id)
}

export async function listPatientEvaluationForms(patientId: string) {
  return supabase
    .from('patient_evaluation_forms')
    .select('*')
    .eq('patient_id', patientId)
    .order('evaluation_date', { ascending: false })
    .order('created_at', { ascending: false })
}

export async function getPatientEvaluationForm(id: string) {
  return supabase
    .from('patient_evaluation_forms')
    .select('*')
    .eq('id', id)
    .maybeSingle()
}

export async function createPatientEvaluationForm(
  payload: PatientEvaluationFormInsert,
) {
  return supabase
    .from('patient_evaluation_forms')
    .insert(payload)
    .select()
    .single()
}

export async function updatePatientEvaluationForm(
  id: string,
  patch: {
    answers?: Json
    evaluation_date?: string
    updated_at?: string
  },
) {
  return supabase
    .from('patient_evaluation_forms')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
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
