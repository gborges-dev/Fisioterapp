import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getActiveWorkspaceId, getToken } from '../../auth/authStorage'
import { isApiConfigured } from '../../../lib/apiClient'
import { queryKeys } from '../../../lib/queryKeys'
import type { FormFieldSchema } from '../../../types/database.types'
import {
  createEvaluationFormTemplate,
  deleteEvaluationFormTemplate,
  getEvaluationFormTemplate,
  listEvaluationFormTemplates,
  updateEvaluationFormTemplate,
} from '../services/evaluationFormsApi'

function isApiReady() {
  return (
    isApiConfigured() &&
    Boolean(getToken()) &&
    Boolean(getActiveWorkspaceId())
  )
}

export function useEvaluationFormTemplates() {
  return useQuery({
    queryKey: queryKeys.evaluationForms.templates,
    queryFn: async () => {
      const { data, error } = await listEvaluationFormTemplates()
      if (error) throw error
      return data ?? []
    },
    enabled: isApiReady(),
    staleTime: 30_000,
  })
}

export function useEvaluationFormTemplate(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.evaluationForms.template(id ?? ''),
    queryFn: async () => {
      const { data, error } = await getEvaluationFormTemplate(id!)
      if (error) throw error
      if (!data) throw new Error('Modelo não encontrado.')
      return data
    },
    enabled: Boolean(id) && isApiReady(),
    staleTime: 30_000,
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
      const workspaceId = getActiveWorkspaceId()
      if (!workspaceId) throw new Error('Workspace ativo em falta.')
      const { data, error } = await createEvaluationFormTemplate(
        workspaceId,
        title,
        description,
        schema,
      )
      if (error) throw error
      if (!data) throw new Error('Resposta vazia ao criar modelo.')
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
      if (!data) throw new Error('Resposta vazia ao atualizar modelo.')
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
