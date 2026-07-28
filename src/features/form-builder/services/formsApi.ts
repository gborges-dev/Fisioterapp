import { apiRequest } from '../../../lib/apiClient'
import type { Database, FormFieldSchema, Json } from '../../../types/database.types'
import { getActiveWorkspaceId } from '../../auth/authStorage'

export type FormTemplateRow =
  Database['public']['Tables']['form_templates']['Row']
type FormLinkRow = Database['public']['Tables']['form_links']['Row']

export async function listFormTemplates(_workspaceId?: string) {
  return apiRequest<FormTemplateRow[]>('/form-templates')
}

export async function getFormTemplate(id: string) {
  return apiRequest<FormTemplateRow>(`/form-templates/${id}`)
}

export async function createFormTemplate(
  workspaceId: string,
  title: string,
  schema: FormFieldSchema[],
) {
  return apiRequest<FormTemplateRow>('/form-templates', {
    method: 'POST',
    body: JSON.stringify({
      title,
      schema,
    }),
    workspaceId: workspaceId || getActiveWorkspaceId(),
  })
}

export async function updateFormTemplate(
  id: string,
  title: string,
  schema: FormFieldSchema[],
) {
  return apiRequest<FormTemplateRow>(`/form-templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title, schema }),
  })
}

export async function deleteFormTemplate(id: string) {
  return apiRequest<{ ok: boolean }>(`/form-templates/${id}`, {
    method: 'DELETE',
  })
}

export async function createFormLink(
  workspaceId: string,
  formTemplateId: string,
) {
  return apiRequest<FormLinkRow>('/form-links', {
    method: 'POST',
    body: JSON.stringify({
      form_template_id: formTemplateId,
    }),
    workspaceId: workspaceId || getActiveWorkspaceId(),
  })
}

export interface PublicFormPayload {
  linkId: string
  publicToken: string
  templateId: string
  title: string
  schema: FormFieldSchema[]
}

type PublicFormResponse = {
  link: {
    id: string
    public_token: string
  }
  template: {
    id: string
    title: string
    schema: Json
  }
}

export async function fetchPublicFormByToken(token: string) {
  const result = await apiRequest<PublicFormResponse>(
    `/public/forms/${token}`,
    { auth: false },
  )
  if (result.error || !result.data) {
    return { data: null as PublicFormPayload | null, error: result.error }
  }

  const { link, template } = result.data
  return {
    data: {
      linkId: link.id,
      publicToken: link.public_token,
      templateId: template.id,
      title: template.title,
      schema: parseFormSchema(template.schema),
    } satisfies PublicFormPayload,
    error: null,
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
      o.type === 'select' ||
      o.type === 'multiselect'
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
  return apiRequest<{ id: string }>(`/public/forms/${token}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
    auth: false,
  })
}
