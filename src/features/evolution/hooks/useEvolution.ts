import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { toastError, toastSuccess } from '../../../components/toast'
import { queryKeys } from '../../../lib/queryKeys'
import { DEFAULT_WORKSPACE_ID } from '../../../lib/workspace'
import { isSupabaseConfigured } from '../../../lib/supabaseClient'
import { createEvolution, listEvolution } from '../services/evolutionApi'

export function useEvolutionEntries(patientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.evolution(patientId ?? ''),
    queryFn: async () => {
      const { data, error } = await listEvolution(patientId!)
      if (error) throw error
      return data
    },
    enabled: Boolean(patientId) && isSupabaseConfigured(),
  })
}

export function useCreateEvolution(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      content,
      entryDate,
    }: {
      content: string
      entryDate: string
    }) => {
      const { data, error } = await createEvolution({
        patient_id: patientId,
        workspace_id: DEFAULT_WORKSPACE_ID,
        content,
        entry_date: entryDate,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toastSuccess('Evolução registada.')
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
