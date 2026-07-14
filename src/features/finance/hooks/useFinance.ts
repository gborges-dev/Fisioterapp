import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { toastError, toastSuccess } from '../../../components/toast'
import { queryKeys } from '../../../lib/queryKeys'
import { isSupabaseConfigured } from '../../../lib/supabaseClient'
import { DEFAULT_WORKSPACE_ID } from '../../../lib/workspace'
import {
  createFinanceEntry,
  deleteFinanceEntry,
  listFinanceEntries,
  updateFinanceEntry,
  type FinanceEntryInsert,
  type FinanceEntryType,
  type FinanceEntryUpdate,
  type FinanceEntryWithPatient,
} from '../services/financeApi'

export type FinanceListParams = {
  from: string
  to: string
  patientId?: string | null
  type?: FinanceEntryType | null
}

export type NewFinanceEntryInput = {
  type: FinanceEntryType
  amount: number
  entryDate: string
  description: string
  patientId?: string | null
}

export function useFinanceEntries(params: FinanceListParams) {
  return useQuery({
    queryKey: queryKeys.finance.list(
      params.from,
      params.to,
      params.patientId ?? null,
      params.type ?? null,
    ),
    queryFn: async () => {
      const { data, error } = await listFinanceEntries({
        workspaceId: DEFAULT_WORKSPACE_ID,
        from: params.from,
        to: params.to,
        patientId: params.patientId,
        type: params.type,
      })
      if (error) throw error
      return (data ?? []) as FinanceEntryWithPatient[]
    },
    enabled: isSupabaseConfigured() && Boolean(params.from && params.to),
  })
}

export function useFinanceMutations() {
  const qc = useQueryClient()

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: queryKeys.finance.all })

  const create = useMutation({
    mutationFn: async (input: NewFinanceEntryInput) => {
      const payload: FinanceEntryInsert = {
        workspace_id: DEFAULT_WORKSPACE_ID,
        type: input.type,
        amount: input.amount,
        entry_date: input.entryDate,
        description: input.description.trim(),
        patient_id: input.patientId || null,
      }
      const { data, error } = await createFinanceEntry(payload)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void invalidate()
      toastSuccess('Lançamento criado.')
    },
    onError: (err) => {
      toastError(err instanceof Error ? err : new Error(String(err)))
    },
  })

  const update = useMutation({
    mutationFn: async ({
      id,
      ...input
    }: NewFinanceEntryInput & { id: string }) => {
      const payload: FinanceEntryUpdate = {
        type: input.type,
        amount: input.amount,
        entry_date: input.entryDate,
        description: input.description.trim(),
        patient_id: input.patientId || null,
      }
      const { data, error } = await updateFinanceEntry(id, payload)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void invalidate()
      toastSuccess('Lançamento atualizado.')
    },
    onError: (err) => {
      toastError(err instanceof Error ? err : new Error(String(err)))
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteFinanceEntry(id)
      if (error) throw error
    },
    onSuccess: () => {
      void invalidate()
      toastSuccess('Lançamento eliminado.')
    },
    onError: (err) => {
      toastError(err instanceof Error ? err : new Error(String(err)))
    },
  })

  return { create, update, remove }
}
