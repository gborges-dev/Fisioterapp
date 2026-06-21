import { supabase } from '../../../lib/supabaseClient'
import type { Database } from '../../../types/database.types'

export type EvolutionRow =
  Database['public']['Tables']['evolution_entries']['Row']
export type EvolutionInsert =
  Database['public']['Tables']['evolution_entries']['Insert']

export async function listEvolution(patientId: string) {
  return supabase
    .from('evolution_entries')
    .select('*')
    .eq('patient_id', patientId)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
}

export async function createEvolution(payload: EvolutionInsert) {
  return supabase.from('evolution_entries').insert(payload).select().single()
}

export async function deleteEvolutionEntry(id: string) {
  return supabase.from('evolution_entries').delete().eq('id', id)
}

export async function updateEvolutionEntry(
  id: string,
  patch: {
    content: string
    entry_date: string
    patient_evaluation_form_id: string
  },
) {
  return supabase
    .from('evolution_entries')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
}

export async function deleteEvolutionEntriesByFormId(formId: string) {
  return supabase
    .from('evolution_entries')
    .delete()
    .eq('patient_evaluation_form_id', formId)
}
