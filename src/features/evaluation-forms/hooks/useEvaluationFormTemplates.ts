import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '../../../lib/queryKeys'
import { DEFAULT_WORKSPACE_ID } from '../../../lib/workspace'
import { isSupabaseConfigured } from '../../../lib/supabaseClient'
import type { FormFieldSchema } from '../../../types/database.types'
import {
  createEvaluationFormTemplate,
  deleteEvaluationFormTemplate,
  getEvaluationFormTemplate,
  listEvaluationFormTemplates,
  updateEvaluationFormTemplate,
} from '../services/evaluationFormsApi'

export function useEvaluationFormTemplates() {
  return useQuery({
    queryKey: queryKeys.evaluationForms.templates,
    queryFn: async () => {
      const { data, error } = await listEvaluationFormTemplates(
        DEFAULT_WORKSPACE_ID,
      )
      if (error) throw error
      return data
    },
    enabled: isSupabaseConfigured(),
  })
}

export function useEvaluationFormTemplate(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.evaluationForms.template(id ?? ''),
    queryFn: async () => {
      const { data, error } = await getEvaluationFormTemplate(id!)
      if (error) throw error
      return data
    },
    enabled: Boolean(id) && isSupabaseConfigured(),
  })
}

export function useEvaluationFormTemplateMutations() {
  const qc = useQueryClient()
  const invalidate = () =>
    void qc.invalidateQueries({
      queryKey: queryKeys.evaluationForms.templates,
    })

  const create = useMutation({
    mutationFn: async ({
      title,
      description,
      schema,
    }: {
      title: string
      description: string | null
      schema: FormFieldSchema[]
    }) => {
      const { data, error } = await createEvaluationFormTemplate(
        DEFAULT_WORKSPACE_ID,
        title,
        description,
        schema,
      )
      if (error) throw error
      return data
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      schema,
    }: {
      id: string
      title: string
      description: string | null
      schema: FormFieldSchema[]
    }) => {
      const { data, error } = await updateEvaluationFormTemplate(
        id,
        title,
        description,
        schema,
      )
      if (error) throw error
      return data
    },
    onSuccess: (_d, v) => {
      invalidate()
      void qc.invalidateQueries({
        queryKey: queryKeys.evaluationForms.template(v.id),
      })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteEvaluationFormTemplate(id)
      if (error) throw error
    },
    onSuccess: (_void, id) => {
      invalidate()
      void qc.removeQueries({
        queryKey: queryKeys.evaluationForms.template(id),
      })
    },
  })

  return { create, update, remove }
}
