import { supabase } from '../../../lib/supabaseClient'
import type { Database } from '../../../types/database.types'

export type PatientRow = Database['public']['Tables']['patients']['Row']
export type PatientInsert = Database['public']['Tables']['patients']['Insert']
export type PatientUpdate = Database['public']['Tables']['patients']['Update']

export async function listPatients(workspaceId: string) {
  return supabase
    .from('patients')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
}

export async function getPatient(id: string) {
  return supabase.from('patients').select('*').eq('id', id).maybeSingle()
}

export async function createPatient(payload: PatientInsert) {
  return supabase.from('patients').insert(payload).select().single()
}

export async function updatePatient(id: string, payload: PatientUpdate) {
  return supabase
    .from('patients')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
}

export async function deletePatient(id: string) {
  return supabase.from('patients').delete().eq('id', id)
}
