import { supabase } from '../../../lib/supabaseClient'
import type { Database } from '../../../types/database.types'

export type DocumentRow =
  Database['public']['Tables']['patient_documents']['Row']
export type DocumentInsert =
  Database['public']['Tables']['patient_documents']['Insert']

const BUCKET = 'patient-documents'

export async function listDocuments(patientId: string) {
  return supabase
    .from('patient_documents')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
}

export async function insertDocumentMeta(payload: DocumentInsert) {
  return supabase.from('patient_documents').insert(payload).select().single()
}

export function getPublicUrl(storagePath: string) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

export async function uploadPatientFile(
  workspaceId: string,
  patientId: string,
  file: File,
) {
  const path = `${workspaceId}/${patientId}/${crypto.randomUUID()}-${file.name}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  return path
}
