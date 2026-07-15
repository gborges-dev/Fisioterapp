import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getActiveWorkspaceId, getToken } from '../../auth/authStorage'
import { isApiConfigured } from '../../../lib/apiClient'
import { queryKeys } from '../../../lib/queryKeys'
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

function isPatientsReady() {
  return (
    isApiConfigured() &&
    Boolean(getToken()) &&
    Boolean(getActiveWorkspaceId())
  )
}

export function usePatients() {
  return useQuery({
    queryKey: queryKeys.patients.all,
    queryFn: async () => {
      const { data, error } = await listPatients()
      if (error) throw error
      return data
    },
    enabled: isPatientsReady(),
    staleTime: 30_000,
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
    enabled: Boolean(id) && isPatientsReady(),
  })
}

export function usePatientMutations() {
  const qc = useQueryClient()

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: queryKeys.patients.all })

  const create = useMutation({
    mutationFn: async (payload: NewPatientInput) => {
      const { data, error } = await createPatient(payload)
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
