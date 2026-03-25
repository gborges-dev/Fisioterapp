import { supabase } from '../../../lib/supabaseClient'
import type { Database } from '../../../types/database.types'

export type PatientSurgeryRow =
  Database['public']['Tables']['patient_surgery']['Row']
export type PatientSurgeryInsert =
  Database['public']['Tables']['patient_surgery']['Insert']

export async function getPatientSurgery(patientId: string) {
  return supabase
    .from('patient_surgery')
    .select('*')
    .eq('patient_id', patientId)
    .maybeSingle()
}

export async function upsertPatientSurgery(
  payload: PatientSurgeryInsert,
): Promise<{ data: PatientSurgeryRow | null; error: Error | null }> {
  const row = {
    ...payload,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from('patient_surgery')
    .upsert(row, { onConflict: 'patient_id' })
    .select()
    .single()
  return { data, error: error as Error | null }
}
