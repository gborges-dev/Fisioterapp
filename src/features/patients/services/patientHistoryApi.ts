import { apiRequest } from '../../../lib/apiClient'
import type { Database } from '../../../types/database.types'
import { getActiveWorkspaceId } from '../../auth/authStorage'

export type PatientHistoryRow =
  Database['public']['Tables']['patient_history']['Row']
export type PatientHistoryInsert =
  Database['public']['Tables']['patient_history']['Insert']
export type PatientHistoryUpdate =
  Database['public']['Tables']['patient_history']['Update']

export async function getPatientHistory(patientId: string) {
  return apiRequest<PatientHistoryRow | null>(
    `/patients/${patientId}/history`,
  )
}

export async function upsertPatientHistory(
  payload: PatientHistoryInsert,
): Promise<{ data: PatientHistoryRow | null; error: Error | null }> {
  const { patient_id, workspace_id, ...body } = payload
  return apiRequest<PatientHistoryRow>(`/patients/${patient_id}/history`, {
    method: 'PUT',
    body: JSON.stringify(body),
    workspaceId: workspace_id ?? getActiveWorkspaceId(),
  })
}
