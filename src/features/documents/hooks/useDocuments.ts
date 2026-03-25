import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { toastError, toastSuccess } from '../../../components/toast'
import { queryKeys } from '../../../lib/queryKeys'
import { DEFAULT_WORKSPACE_ID } from '../../../lib/workspace'
import { isSupabaseConfigured } from '../../../lib/supabaseClient'
import {
  deletePatientDocument,
  getPublicUrl,
  insertDocumentMeta,
  listDocuments,
  uploadPatientFile,
} from '../services/documentsApi'

export function usePatientDocuments(patientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.documents(patientId ?? ''),
    queryFn: async () => {
      const { data, error } = await listDocuments(patientId!)
      if (error) throw error
      return data
    },
    enabled: Boolean(patientId) && isSupabaseConfigured(),
  })
}

export function useUploadDocument(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const path = await uploadPatientFile(
        DEFAULT_WORKSPACE_ID,
        patientId,
        file,
      )
      const { data, error } = await insertDocumentMeta({
        patient_id: patientId,
        workspace_id: DEFAULT_WORKSPACE_ID,
        storage_path: path,
        file_name: file.name,
        mime_type: file.type || null,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toastSuccess('Documento enviado com sucesso.')
      void qc.invalidateQueries({
        queryKey: queryKeys.documents(patientId),
      })
    },
    onError: (err) => {
      toastError(err instanceof Error ? err : new Error(String(err)))
    },
  })
}

export function useDeleteDocument(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      documentId,
      storagePath,
    }: {
      documentId: string
      storagePath: string
    }) => {
      await deletePatientDocument(documentId, storagePath)
    },
    onSuccess: () => {
      toastSuccess('Anexo eliminado.')
      void qc.invalidateQueries({
        queryKey: queryKeys.documents(patientId),
      })
    },
    onError: (err) => {
      toastError(err instanceof Error ? err : new Error(String(err)))
    },
  })
}

export { getPublicUrl }
