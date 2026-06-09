import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '../../../lib/queryKeys'
import { DEFAULT_WORKSPACE_ID } from '../../../lib/workspace'
import { isSupabaseConfigured } from '../../../lib/supabaseClient'
import {
  createPatient,
  updatePatient,
  type PatientUpdate,
} from '../services/patientsApi'
import { getPatientHistory } from '../services/patientHistoryApi'
import { getPatientSurgery } from '../services/patientSurgeryApi'
import type { NewPatientInput } from './usePatients'

export function usePatientHistory(patientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.patients.history(patientId ?? ''),
    queryFn: async () => {
      const { data, error } = await getPatientHistory(patientId!)
      if (error) throw error
      return data
    },
    enabled: Boolean(patientId) && isSupabaseConfigured(),
  })
}

export function usePatientSurgeryQuery(patientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.patients.surgery(patientId ?? ''),
    queryFn: async () => {
      const { data, error } = await getPatientSurgery(patientId!)
      if (error) throw error
      return data
    },
    enabled: Boolean(patientId) && isSupabaseConfigured(),
  })
}

function invalidatePatientRelated(qc: ReturnType<typeof useQueryClient>, id: string) {
  void qc.invalidateQueries({ queryKey: queryKeys.patients.all })
  void qc.invalidateQueries({ queryKey: queryKeys.patients.detail(id) })
  void qc.invalidateQueries({
    queryKey: queryKeys.dashboard.evolutionOverview,
  })
}

export function useSavePatient() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (
      input:
        | { mode: 'create'; patient: NewPatientInput }
        | { mode: 'update'; patientId: string; patient: PatientUpdate },
    ) => {
      if (input.mode === 'create') {
        const { data: p, error } = await createPatient({
          ...input.patient,
          workspace_id: DEFAULT_WORKSPACE_ID,
        })
        if (error) throw error
        if (!p) throw new Error('Paciente não criado')
        return { patientId: p.id }
      }

      const { error: eu } = await updatePatient(input.patientId, input.patient)
      if (eu) throw eu
      return { patientId: input.patientId }
    },
    onSuccess: (data) => {
      invalidatePatientRelated(qc, data.patientId)
    },
  })
}

/** @deprecated Use useSavePatient */
export const useSavePatientFicha = useSavePatient
