import { supabase } from '../../../lib/supabaseClient'
import type { Database } from '../../../types/database.types'

export type FinanceEntryRow = Database['public']['Tables']['finance_entries']['Row']
export type FinanceEntryInsert =
  Database['public']['Tables']['finance_entries']['Insert']
export type FinanceEntryUpdate =
  Database['public']['Tables']['finance_entries']['Update']

export type FinanceEntryType = FinanceEntryRow['type']

export type FinanceEntryWithPatient = FinanceEntryRow & {
  patients: { full_name: string } | null
}

export type ListFinanceFilters = {
  workspaceId: string
  from: string
  to: string
  patientId?: string | null
  type?: FinanceEntryType | null
}

export function listFinanceEntries(filters: ListFinanceFilters) {
  let query = supabase
    .from('finance_entries')
    .select('*, patients(full_name)')
    .eq('workspace_id', filters.workspaceId)
    .gte('entry_date', filters.from)
    .lte('entry_date', filters.to)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters.patientId) {
    query = query.eq('patient_id', filters.patientId)
  }

  if (filters.type) {
    query = query.eq('type', filters.type)
  }

  return query
}

export function createFinanceEntry(payload: FinanceEntryInsert) {
  return supabase.from('finance_entries').insert(payload).select().single()
}

export function updateFinanceEntry(id: string, payload: FinanceEntryUpdate) {
  return supabase
    .from('finance_entries')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
}

export function deleteFinanceEntry(id: string) {
  return supabase.from('finance_entries').delete().eq('id', id)
}
