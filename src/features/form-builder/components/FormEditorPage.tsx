import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { GlassPanel, PageHeader } from '@/components/AppShell'
import { FormFieldOptionsInput } from '@/components/FormFieldOptionsInput'
import { ApiConfigAlert } from '@/components/ApiConfigAlert'
import { useToast } from '@/components/toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { isOptionFieldType, validateOptionFields } from '@/lib/formFieldValidation'
import type { FormFieldSchema, Json } from '@/types/database.types'
import { useFormTemplate, useFormTemplateMutations } from '../hooks/useFormTemplates'
import { parseFormSchema } from '../services/formsApi'

function newField(): FormFieldSchema {
  return {
    id: crypto.randomUUID(),
    label: 'Nova pergunta',
    type: 'text',
    required: false,
  }
}

type FormTemplateRow = {
  id: string
  title: string
  schema: unknown
}

export function FormEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id
  const { data: existing, isLoading, isError, error } = useFormTemplate(
    isNew ? undefined : id,
  )

  if (!isNew && isLoading) {
    return (
      <div className="flex justify-center py-12" aria-label="A carregar formulário">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  if (!isNew && isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{(error as Error).message}</AlertDescription>
      </Alert>
    )
  }
  if (isNew) {
    return <FormEditorFields key="new" initial={null} />
  }

  if (!existing) {
    return (
      <Alert variant="warning">
        <AlertDescription>Formulário não encontrado.</AlertDescription>
      </Alert>
    )
  }

  return (
    <FormEditorFields
      key={existing.id}
      templateId={existing.id}
      initial={{
        id: existing.id,
        title: existing.title,
        schema: existing.schema,
      }}
    />
  )
}

function FormEditorFields({
  templateId,
  initial,
}: {
  templateId?: string
  initial: FormTemplateRow | null
}) {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const { create, update } = useFormTemplateMutations()
  const isNew = !initial

  const [title, setTitle] = useState(
    () => initial?.title ?? 'Novo formulário',
  )
  const [fields, setFields] = useState<FormFieldSchema[]>(() =>
    initial ? parseFormSchema(initial.schema as Json) : [newField()],
  )

  const updateField = (index: number, patch: Partial<FormFieldSchema>) => {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    )
  }

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const optionError = validateOptionFields(fields)
    if (optionError) {
      showError(new Error(optionError))
      return
    }

    try {
      if (isNew) {
        const row = await create.mutateAsync({
          title: title.trim(),
          schema: fields,
        })
        showSuccess('Formulário criado.')
        void navigate(`/forms/${row.id}/edit`)
      } else if (templateId) {
        await update.mutateAsync({
          id: templateId,
          title: title.trim(),
          schema: fields,
        })
        showSuccess('Alterações guardadas.')
      }
    } catch (e) {
      showError(e instanceof Error ? e : new Error(String(e)))
    }
  }

  const pending = create.isPending || update.isPending
  const err = create.error ?? update.error

  const crumbs = isNew
    ? [
        { label: 'Painel', to: '/' },
        { label: 'Formulários', to: '/forms' },
        { label: 'Novo formulário' },
      ]
    : [
        { label: 'Painel', to: '/' },
        { label: 'Formulários', to: '/forms' },
        { label: title.trim() || 'Formulário' },
      ]

  return (
    <div>
      <PageHeader
        breadcrumbs={crumbs}
        title={isNew ? 'Novo formulário' : 'Editar formulário'}
      />
      <ApiConfigAlert />
      {err ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{(err as Error).message}</AlertDescription>
        </Alert>
      ) : null}
      <form onSubmit={handleSubmit}>
        <GlassPanel className="max-w-3xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="form-title">Título</Label>
            <Input
              id="form-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium">Campos</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFields((f) => [...f, newField()])}
            >
              <Plus />
              Adicionar campo
            </Button>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col gap-3 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-start"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor={`label-${field.id}`}>Texto da pergunta</Label>
                <Input
                  id={`label-${field.id}`}
                  value={field.label}
                  onChange={(e) => updateField(index, { label: e.target.value })}
                />
              </div>
              <div className="w-full space-y-2 sm:w-40">
                <Label htmlFor={`type-${field.id}`}>Tipo</Label>
                <Select
                  value={field.type}
                  onValueChange={(value) =>
                    updateField(index, {
                      type: value as FormFieldSchema['type'],
                    })
                  }
                >
                  <SelectTrigger id={`type-${field.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto curto</SelectItem>
                    <SelectItem value="textarea">Texto longo</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="date">Data</SelectItem>
                    <SelectItem value="select">Escolha</SelectItem>
                    <SelectItem value="multiselect">Múltipla escolha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor={`options-${field.id}`}>
                  Opções (separadas por vírgula)
                </Label>
                <FormFieldOptionsInput
                  id={`options-${field.id}`}
                  fieldId={field.id}
                  options={field.options}
                  disabled={!isOptionFieldType(field.type)}
                  onOptionsChange={(options) => updateField(index, { options })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive hover:text-destructive"
                aria-label="Remover campo"
                onClick={() => removeField(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              Guardar
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/forms">Voltar</Link>
            </Button>
          </div>
        </GlassPanel>
      </form>
    </div>
  )
}
