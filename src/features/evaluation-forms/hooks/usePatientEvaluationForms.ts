import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '../../../lib/queryKeys'
import { DEFAULT_WORKSPACE_ID } from '../../../lib/workspace'
import { isSupabaseConfigured } from '../../../lib/supabaseClient'
import type { FormFieldSchema, Json } from '../../../types/database.types'
import {
  createPatientEvaluationForm,
  getPatientEvaluationForm,
  listPatientEvaluationForms,
  updatePatientEvaluationForm,
} from '../services/evaluationFormsApi'

export function usePatientEvaluationForms(patientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.evaluationForms.byPatient(patientId ?? ''),
    queryFn: async () => {
      const { data, error } = await listPatientEvaluationForms(patientId!)
      if (error) throw error
      return data
    },
    enabled: Boolean(patientId) && isSupabaseConfigured(),
  })
}

export function usePatientEvaluationForm(
  patientId: string | undefined,
  formId: string | undefined,
) {
  return useQuery({
    queryKey: queryKeys.evaluationForms.detail(patientId ?? '', formId ?? ''),
    queryFn: async () => {
      const { data, error } = await getPatientEvaluationForm(formId!)
      if (error) throw error
      return data
    },
    enabled:
      Boolean(patientId) &&
      Boolean(formId) &&
      isSupabaseConfigured(),
  })
}

export function useCreatePatientEvaluationForm(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      templateId,
      title,
      schema,
      answers,
      evaluationDate,
    }: {
      templateId: string
      title: string
      schema: FormFieldSchema[]
      answers: Record<string, string>
      evaluationDate: string
    }) => {
      const { data, error } = await createPatientEvaluationForm({
        patient_id: patientId,
        workspace_id: DEFAULT_WORKSPACE_ID,
        template_id: templateId,
        title,
        schema: schema as unknown as Json,
        answers: answers as unknown as Json,
        evaluation_date: evaluationDate,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.evaluationForms.byPatient(patientId),
      })
    },
  })
}

export function useUpdatePatientEvaluationForm(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      formId,
      answers,
      evaluationDate,
    }: {
      formId: string
      answers: Record<string, string>
      evaluationDate: string
    }) => {
      const { data, error } = await updatePatientEvaluationForm(formId, {
        answers: answers as unknown as Json,
        evaluation_date: evaluationDate,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.evaluationForms.byPatient(patientId),
      })
      void qc.invalidateQueries({
        queryKey: queryKeys.evaluationForms.detail(patientId, v.formId),
      })
    },
  })
}
