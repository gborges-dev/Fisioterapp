import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '../../../lib/queryKeys'
import { DEFAULT_WORKSPACE_ID } from '../../../lib/workspace'
import { isSupabaseConfigured } from '../../../lib/supabaseClient'
import {
  createPatient,
  deletePatient,
  getPatient,
  listPatients,
  updatePatient,
  type PatientInsert,
  type PatientUpdate,
} from '../services/patientsApi'

export type NewPatientInput = Omit<PatientInsert, 'workspace_id'>

export function usePatients() {
  return useQuery({
    queryKey: queryKeys.patients.all,
    queryFn: async () => {
      const { data, error } = await listPatients(DEFAULT_WORKSPACE_ID)
      if (error) throw error
      return data
    },
    enabled: isSupabaseConfigured(),
  })
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.patients.detail(id ?? ''),
    queryFn: async () => {
      const { data, error } = await getPatient(id!)
      if (error) throw error
      return data
    },
    enabled: Boolean(id) && isSupabaseConfigured(),
  })
}

export function usePatientMutations() {
  const qc = useQueryClient()

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: queryKeys.patients.all })

  const create = useMutation({
    mutationFn: async (payload: NewPatientInput) => {
      const { data, error } = await createPatient({
        ...payload,
        workspace_id: DEFAULT_WORKSPACE_ID,
      })
      if (error) throw error
      return data
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string
      payload: PatientUpdate
    }) => {
      const { data, error } = await updatePatient(id, payload)
      if (error) throw error
      return data
    },
    onSuccess: (_d, v) => {
      void invalidate()
      void qc.invalidateQueries({
        queryKey: queryKeys.patients.detail(v.id),
      })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deletePatient(id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
