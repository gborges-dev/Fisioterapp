import { apiRequest } from '../../../lib/apiClient'
import type { Database } from '../../../types/database.types'
import { getActiveWorkspaceId } from '../../auth/authStorage'

export type PatientSurgeryRow =
  Database['public']['Tables']['patient_surgery']['Row']
export type PatientSurgeryInsert =
  Database['public']['Tables']['patient_surgery']['Insert']

export async function getPatientSurgery(patientId: string) {
  return apiRequest<PatientSurgeryRow | null>(
    `/patients/${patientId}/surgery`,
  )
}

export async function upsertPatientSurgery(
  payload: PatientSurgeryInsert,
): Promise<{ data: PatientSurgeryRow | null; error: Error | null }> {
  const { patient_id, workspace_id, ...body } = payload
  return apiRequest<PatientSurgeryRow>(`/patients/${patient_id}/surgery`, {
    method: 'PUT',
    body: JSON.stringify(body),
    workspaceId: workspace_id ?? getActiveWorkspaceId(),
  })
}
