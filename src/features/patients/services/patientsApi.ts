import { apiRequest } from '../../../lib/apiClient'
import type { Database } from '../../../types/database.types'
import { getActiveWorkspaceId } from '../../auth/authStorage'

export type PatientRow = Database['public']['Tables']['patients']['Row']
export type PatientInsert = Database['public']['Tables']['patients']['Insert']
export type PatientUpdate = Database['public']['Tables']['patients']['Update']

export async function listPatients(_workspaceId?: string) {
  return apiRequest<PatientRow[]>('/patients')
}

export async function getPatient(id: string) {
  return apiRequest<PatientRow>(`/patients/${id}`)
}

export async function createPatient(
  payload: Omit<PatientInsert, 'workspace_id'> & { workspace_id?: string },
) {
  const { workspace_id, ...body } = payload
  return apiRequest<PatientRow>('/patients', {
    method: 'POST',
    body: JSON.stringify(body),
    workspaceId: workspace_id ?? getActiveWorkspaceId(),
  })
}

export async function updatePatient(id: string, payload: PatientUpdate) {
  return apiRequest<PatientRow>(`/patients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deletePatient(id: string) {
  return apiRequest<{ ok: boolean }>(`/patients/${id}`, { method: 'DELETE' })
}
