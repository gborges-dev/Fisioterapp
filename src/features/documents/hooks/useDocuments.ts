import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { toastError, toastSuccess } from '../../../components/toast'
import { getActiveWorkspaceId, getToken } from '../../auth/authStorage'
import { isApiConfigured } from '../../../lib/apiClient'
import { queryKeys } from '../../../lib/queryKeys'
import {
  deletePatientDocument,
  listDocuments,
  uploadPatientDocument,
} from '../services/documentsApi'

function isApiReady() {
  return (
    isApiConfigured() &&
    Boolean(getToken()) &&
    Boolean(getActiveWorkspaceId())
  )
}

export function usePatientDocuments(patientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.documents(patientId ?? ''),
    queryFn: async () => {
      const { data, error } = await listDocuments(patientId!)
      if (error) throw error
      return data
    },
    enabled: Boolean(patientId) && isApiReady(),
  })
}

export function useUploadDocument(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const { data, error } = await uploadPatientDocument(patientId, file)
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
    mutationFn: async ({ documentId }: { documentId: string }) => {
      const { error } = await deletePatientDocument(documentId)
      if (error) throw error
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
