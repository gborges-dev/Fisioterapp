import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getActiveWorkspaceId, getToken } from '../../auth/authStorage'
import { isApiConfigured } from '../../../lib/apiClient'
import { queryKeys } from '../../../lib/queryKeys'
import type { FormFieldSchema } from '../../../types/database.types'
import {
  createFormLink,
  createFormTemplate,
  deleteFormTemplate,
  getFormTemplate,
  listFormTemplates,
  updateFormTemplate,
} from '../services/formsApi'

function isApiReady() {
  return (
    isApiConfigured() &&
    Boolean(getToken()) &&
    Boolean(getActiveWorkspaceId())
  )
}

export function useFormTemplates() {
  return useQuery({
    queryKey: queryKeys.forms.templates,
    queryFn: async () => {
      const { data, error } = await listFormTemplates()
      if (error) throw error
      return data ?? []
    },
    enabled: isApiReady(),
    staleTime: 30_000,
  })
}

export function useFormTemplate(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.forms.template(id ?? ''),
    queryFn: async () => {
      const { data, error } = await getFormTemplate(id!)
      if (error) throw error
      if (!data) throw new Error('Formulário não encontrado.')
      return data
    },
    enabled: Boolean(id) && isApiReady(),
    staleTime: 30_000,
  })
}

export function useFormTemplateMutations() {
  const qc = useQueryClient()
  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: queryKeys.forms.templates })

  const create = useMutation({
    mutationFn: async ({
      title,
      schema,
    }: {
      title: string
      schema: FormFieldSchema[]
    }) => {
      const workspaceId = getActiveWorkspaceId()
      if (!workspaceId) throw new Error('Workspace ativo em falta.')
      const { data, error } = await createFormTemplate(
        workspaceId,
        title,
        schema,
      )
      if (error) throw error
      if (!data) throw new Error('Resposta vazia ao criar formulário.')
      return data
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({
      id,
      title,
      schema,
    }: {
      id: string
      title: string
      schema: FormFieldSchema[]
    }) => {
      const { data, error } = await updateFormTemplate(id, title, schema)
      if (error) throw error
      if (!data) throw new Error('Resposta vazia ao atualizar formulário.')
      return data
    },
    onSuccess: (_d, v) => {
      invalidate()
      void qc.invalidateQueries({
        queryKey: queryKeys.forms.template(v.id),
      })
    },
  })

  const createLink = useMutation({
    mutationFn: async (formTemplateId: string) => {
      const workspaceId = getActiveWorkspaceId()
      if (!workspaceId) throw new Error('Workspace ativo em falta.')
      const { data, error } = await createFormLink(workspaceId, formTemplateId)
      if (error) throw error
      if (!data) throw new Error('Resposta vazia ao criar link.')
      return data
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteFormTemplate(id)
      if (error) throw error
    },
    onSuccess: (_void, id) => {
      invalidate()
      void qc.removeQueries({ queryKey: queryKeys.forms.template(id) })
    },
  })

  return { create, update, createLink, remove }
}
