import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '../../../lib/queryKeys'
import { DEFAULT_WORKSPACE_ID } from '../../../lib/workspace'
import { isSupabaseConfigured } from '../../../lib/supabaseClient'
import type { FormFieldSchema } from '../../../types/database.types'
import {
  createFormLink,
  createFormTemplate,
  deleteFormTemplate,
  getFormTemplate,
  listFormTemplates,
  updateFormTemplate,
} from '../services/formsApi'

export function useFormTemplates() {
  return useQuery({
    queryKey: queryKeys.forms.templates,
    queryFn: async () => {
      const { data, error } = await listFormTemplates(DEFAULT_WORKSPACE_ID)
      if (error) throw error
      return data
    },
    enabled: isSupabaseConfigured(),
  })
}

export function useFormTemplate(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.forms.template(id ?? ''),
    queryFn: async () => {
      const { data, error } = await getFormTemplate(id!)
      if (error) throw error
      return data
    },
    enabled: Boolean(id) && isSupabaseConfigured(),
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
      const { data, error } = await createFormTemplate(
        DEFAULT_WORKSPACE_ID,
        title,
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
      schema,
    }: {
      id: string
      title: string
      schema: FormFieldSchema[]
    }) => {
      const { data, error } = await updateFormTemplate(id, title, schema)
      if (error) throw error
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
      const { data, error } = await createFormLink(
        DEFAULT_WORKSPACE_ID,
        formTemplateId,
      )
      if (error) throw error
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
