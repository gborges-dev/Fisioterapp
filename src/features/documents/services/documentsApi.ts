import { supabase } from '../../../lib/supabaseClient'
import type { Database } from '../../../types/database.types'

export type DocumentRow =
  Database['public']['Tables']['patient_documents']['Row']
export type DocumentInsert =
  Database['public']['Tables']['patient_documents']['Insert']

const BUCKET = 'patient-documents'

/**
 * Extensão segura para a chave no Storage (apenas letras/números, 1–10 chars).
 * O nome amigável continua em `patient_documents.file_name` (original do utilizador).
 */
export function safeStorageExtension(fileName: string): string {
  const trimmed = fileName.trim()
  const match = trimmed.match(/\.([a-zA-Z0-9]{1,10})$/)
  return match ? `.${match[1]!.toLowerCase()}` : ''
}

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
  const ext = safeStorageExtension(file.name)
  const path = `${workspaceId}/${patientId}/${crypto.randomUUID()}${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  return path
}

/** Remove o ficheiro do Storage e a linha em `patient_documents`. */
export async function deletePatientDocument(
  documentId: string,
  storagePath: string,
) {
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath])
  if (storageError) throw storageError

  const { error } = await supabase
    .from('patient_documents')
    .delete()
    .eq('id', documentId)
  if (error) throw error
}

/** Descarrega via blob para sugerir o nome original (URLs públicas cross-origin). */
export async function downloadDocumentFile(publicUrl: string, fileName: string) {
  const res = await fetch(publicUrl)
  if (!res.ok) {
    throw new Error('Não foi possível transferir o ficheiro.')
  }
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = fileName
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
