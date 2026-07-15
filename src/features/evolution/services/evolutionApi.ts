import { apiRequest } from '../../../lib/apiClient'
import type { Database } from '../../../types/database.types'
import { getActiveWorkspaceId } from '../../auth/authStorage'

export type EvolutionRow =
  Database['public']['Tables']['evolution_entries']['Row']
export type EvolutionInsert =
  Database['public']['Tables']['evolution_entries']['Insert']

export async function listEvolution(patientId: string) {
  return apiRequest<EvolutionRow[]>(`/patients/${patientId}/evolutions`)
}

export async function createEvolution(
  payload: Omit<EvolutionInsert, 'workspace_id'> & { workspace_id?: string },
) {
  const { patient_id, workspace_id, ...body } = payload
  return apiRequest<EvolutionRow>(`/patients/${patient_id}/evolutions`, {
    method: 'POST',
    body: JSON.stringify(body),
    workspaceId: workspace_id ?? getActiveWorkspaceId(),
  })
}

export async function deleteEvolutionEntry(id: string) {
  return apiRequest<{ ok: boolean }>(`/evolutions/${id}`, { method: 'DELETE' })
}

export async function updateEvolutionEntry(
  id: string,
  patch: {
    content: string
    entry_date: string
    patient_evaluation_form_id: string
  },
) {
  return apiRequest<EvolutionRow>(`/evolutions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function deleteEvolutionEntriesByFormId(formId: string) {
  const qs = new URLSearchParams({ patientEvaluationFormId: formId })
  return apiRequest<{ ok: boolean }>(`/evolutions?${qs}`, { method: 'DELETE' })
}
