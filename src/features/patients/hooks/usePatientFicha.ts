import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '../../../lib/queryKeys'
import { DEFAULT_WORKSPACE_ID } from '../../../lib/workspace'
import { isSupabaseConfigured } from '../../../lib/supabaseClient'
import {
  createPatient,
  updatePatient,
  type PatientUpdate,
} from '../services/patientsApi'
import {
  getPatientHistory,
  upsertPatientHistory,
  type PatientHistoryInsert,
} from '../services/patientHistoryApi'
import {
  getPatientSurgery,
  upsertPatientSurgery,
  type PatientSurgeryInsert,
} from '../services/patientSurgeryApi'
import type { NewPatientInput } from './usePatients'

export type PatientFichaHistoryInput = Omit<
  PatientHistoryInsert,
  'patient_id' | 'workspace_id'
>

export type PatientFichaSurgeryInput = Omit<
  PatientSurgeryInsert,
  'patient_id' | 'workspace_id'
>

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
  void qc.invalidateQueries({ queryKey: queryKeys.patients.history(id) })
  void qc.invalidateQueries({ queryKey: queryKeys.patients.surgery(id) })
  void qc.invalidateQueries({
    queryKey: queryKeys.dashboard.evolutionOverview,
  })
}

export function useSavePatientFicha() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (
      input:
        | {
            mode: 'create'
            patient: NewPatientInput
            history: PatientFichaHistoryInput
            surgery: PatientFichaSurgeryInput
          }
        | {
            mode: 'update'
            patientId: string
            patient: PatientUpdate
            history: PatientFichaHistoryInput
            surgery: PatientFichaSurgeryInput
          },
    ) => {
      const ws = DEFAULT_WORKSPACE_ID

      if (input.mode === 'create') {
        const { data: p, error } = await createPatient({
          ...input.patient,
          workspace_id: ws,
        })
        if (error) throw error
        if (!p) throw new Error('Paciente não criado')

        const { error: eh } = await upsertPatientHistory({
          patient_id: p.id,
          workspace_id: ws,
          ...input.history,
        })
        if (eh) throw eh

        const { error: es } = await upsertPatientSurgery({
          patient_id: p.id,
          workspace_id: ws,
          ...input.surgery,
        })
        if (es) throw es

        return { patientId: p.id }
      }

      const { error: eu } = await updatePatient(input.patientId, input.patient)
      if (eu) throw eu

      const { error: eh } = await upsertPatientHistory({
        patient_id: input.patientId,
        workspace_id: ws,
        ...input.history,
      })
      if (eh) throw eh

      const { error: es } = await upsertPatientSurgery({
        patient_id: input.patientId,
        workspace_id: ws,
        ...input.surgery,
      })
      if (es) throw es

      return { patientId: input.patientId }
    },
    onSuccess: (data) => {
      invalidatePatientRelated(qc, data.patientId)
    },
  })
}
