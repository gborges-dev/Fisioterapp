import { apiRequest } from '../../../lib/apiClient'
import type { Database } from '../../../types/database.types'
import { getActiveWorkspaceId } from '../../auth/authStorage'

export type DocumentRow =
  Database['public']['Tables']['patient_documents']['Row'] & {
    public_url?: string | null
  }

export async function listDocuments(patientId: string) {
  return apiRequest<DocumentRow[]>(`/patients/${patientId}/documents`)
}

export async function uploadPatientDocument(
  patientId: string,
  file: File,
  workspaceId?: string | null,
) {
  const form = new FormData()
  form.append('file', file)
  return apiRequest<DocumentRow>(`/patients/${patientId}/documents`, {
    method: 'POST',
    body: form,
    workspaceId: workspaceId ?? getActiveWorkspaceId(),
  })
}

export async function deletePatientDocument(documentId: string) {
  return apiRequest<{ ok: boolean }>(`/documents/${documentId}`, {
    method: 'DELETE',
  })
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
