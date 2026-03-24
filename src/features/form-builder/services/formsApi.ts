import { supabase } from '../../../lib/supabaseClient'
import type { FormFieldSchema, Json } from '../../../types/database.types'

export async function listFormTemplates(workspaceId: string) {
  return supabase
    .from('form_templates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })
}

export async function getFormTemplate(id: string) {
  return supabase.from('form_templates').select('*').eq('id', id).maybeSingle()
}

export async function createFormTemplate(
  workspaceId: string,
  title: string,
  schema: FormFieldSchema[],
) {
  return supabase
    .from('form_templates')
    .insert({
      workspace_id: workspaceId,
      title,
      schema: schema as unknown as Json,
    })
    .select()
    .single()
}

export async function updateFormTemplate(
  id: string,
  title: string,
  schema: FormFieldSchema[],
) {
  return supabase
    .from('form_templates')
    .update({
      title,
      schema: schema as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
}

export async function createFormLink(
  workspaceId: string,
  formTemplateId: string,
) {
  return supabase
    .from('form_links')
    .insert({
      workspace_id: workspaceId,
      form_template_id: formTemplateId,
    })
    .select()
    .single()
}

export interface PublicFormPayload {
  linkId: string
  publicToken: string
  templateId: string
  title: string
  schema: FormFieldSchema[]
}

export async function fetchPublicFormByToken(
  token: string,
): Promise<PublicFormPayload | null> {
  const { data, error } = await supabase
    .from('form_links')
    .select(
      `
      id,
      public_token,
      form_template_id,
      form_templates (
        id,
        title,
        schema
      )
    `,
    )
    .eq('public_token', token)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const tpl = data.form_templates as unknown as {
    id: string
    title: string
    schema: Json
  } | null

  if (!tpl) return null

  const schema = parseFormSchema(tpl.schema)

  return {
    linkId: data.id,
    publicToken: data.public_token,
    templateId: tpl.id,
    title: tpl.title,
    schema,
  }
}

export function parseFormSchema(raw: Json): FormFieldSchema[] {
  if (!Array.isArray(raw)) return []
  const out: FormFieldSchema[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const id = typeof o.id === 'string' ? o.id : crypto.randomUUID()
    const label = typeof o.label === 'string' ? o.label : 'Campo'
    const type =
      o.type === 'text' ||
      o.type === 'textarea' ||
      o.type === 'number' ||
      o.type === 'date' ||
      o.type === 'select'
        ? o.type
        : 'text'
    const required = Boolean(o.required)
    const options = Array.isArray(o.options)
      ? o.options.filter((x): x is string => typeof x === 'string')
      : undefined
    out.push({ id, label, type, required, options })
  }
  return out
}

export async function submitPublicForm(token: string, answers: Json) {
  return supabase.rpc('submit_form_response', {
    p_token: token,
    p_answers: answers,
  })
}
