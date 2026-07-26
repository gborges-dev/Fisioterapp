import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { toastError, toastSuccess } from '../../../components/toast'
import { getActiveWorkspaceId, getToken } from '../../auth/authStorage'
import { isApiConfigured } from '../../../lib/apiClient'
import { queryKeys } from '../../../lib/queryKeys'
import {
  createEvolution,
  deleteEvolutionEntry,
  listEvolution,
  updateEvolutionEntry,
  type EvolutionRow,
} from '../services/evolutionApi'

const LIST_STALE_MS = 30_000

function isApiReady() {
  return (
    isApiConfigured() &&
    Boolean(getToken()) &&
    Boolean(getActiveWorkspaceId())
  )
}

export function useEvolutionEntries(patientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.evolution(patientId ?? ''),
    queryFn: async () => {
      const { data, error } = await listEvolution(patientId!)
      if (error) throw error
      return data ?? []
    },
    enabled: Boolean(patientId) && isApiReady(),
    staleTime: LIST_STALE_MS,
  })
}

export function useCreateEvolution(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      content,
      entryDate,
      patientEvaluationFormId,
    }: {
      content: string
      entryDate: string
      patientEvaluationFormId: string
    }) => {
      const { data, error } = await createEvolution({
        patient_id: patientId,
        patient_evaluation_form_id: patientEvaluationFormId,
        content,
        entry_date: entryDate,
      })
      if (error) throw error
      return data
    },
    onSuccess: (newRow) => {
      toastSuccess('Evolução registada.')
      if (newRow) {
        qc.setQueryData<EvolutionRow[]>(
          queryKeys.evolution(patientId),
          (prev) => [newRow, ...(prev ?? [])],
        )
      }
      void qc.invalidateQueries({
        queryKey: queryKeys.dashboard.evolutionOverview,
      })
      void qc.invalidateQueries({
        queryKey: queryKeys.dashboard.summary,
      })
    },
    onError: (err) => {
      toastError(err instanceof Error ? err : new Error(String(err)))
    },
  })
}

export function useDeleteEvolutionEntry(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await deleteEvolutionEntry(entryId)
      if (error) throw error
    },
    onSuccess: () => {
      toastSuccess('Registo de evolução eliminado.')
      void qc.invalidateQueries({
        queryKey: queryKeys.evolution(patientId),
      })
      void qc.invalidateQueries({
        queryKey: queryKeys.dashboard.evolutionOverview,
      })
      void qc.invalidateQueries({
        queryKey: queryKeys.dashboard.summary,
      })
    },
    onError: (err) => {
      toastError(err instanceof Error ? err : new Error(String(err)))
    },
  })
}

export function useUpdateEvolutionEntry(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      entryId,
      content,
      entryDate,
      patientEvaluationFormId,
    }: {
      entryId: string
      content: string
      entryDate: string
      patientEvaluationFormId: string
    }) => {
      const { data, error } = await updateEvolutionEntry(entryId, {
        content,
        entry_date: entryDate,
        patient_evaluation_form_id: patientEvaluationFormId,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toastSuccess('Registo de evolução atualizado.')
      void qc.invalidateQueries({
        queryKey: queryKeys.evolution(patientId),
      })
      void qc.invalidateQueries({
        queryKey: queryKeys.dashboard.evolutionOverview,
      })
      void qc.invalidateQueries({
        queryKey: queryKeys.dashboard.summary,
      })
    },
    onError: (err) => {
      toastError(err instanceof Error ? err : new Error(String(err)))
    },
  })
}
