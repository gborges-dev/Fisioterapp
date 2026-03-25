import { supabase } from '../../../lib/supabaseClient'
import type { Database } from '../../../types/database.types'

export type PatientHistoryRow =
  Database['public']['Tables']['patient_history']['Row']
export type PatientHistoryInsert =
  Database['public']['Tables']['patient_history']['Insert']
export type PatientHistoryUpdate =
  Database['public']['Tables']['patient_history']['Update']

export async function getPatientHistory(patientId: string) {
  return supabase
    .from('patient_history')
    .select('*')
    .eq('patient_id', patientId)
    .maybeSingle()
}

export async function upsertPatientHistory(
  payload: PatientHistoryInsert,
): Promise<{ data: PatientHistoryRow | null; error: Error | null }> {
  const row = {
    ...payload,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from('patient_history')
    .upsert(row, { onConflict: 'patient_id' })
    .select()
    .single()
  return { data, error: error as Error | null }
}
