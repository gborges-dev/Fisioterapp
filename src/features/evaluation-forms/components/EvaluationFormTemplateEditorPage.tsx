import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { PageHeader } from '@/components/AppShell'
import { FormFieldOptionsInput } from '@/components/FormFieldOptionsInput'
import { ApiConfigAlert } from '@/components/ApiConfigAlert'
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/toast'
import { isOptionFieldType, validateOptionFields } from '@/lib/formFieldValidation'
import type { FormFieldSchema } from '@/types/database.types'
import {
  useEvaluationFormTemplate,
  useEvaluationFormTemplateMutations,
} from '../hooks/useEvaluationFormTemplates'
import { parseEvaluationSchema } from '../services/evaluationFormsApi'

function newField(): FormFieldSchema {
  return {
    id: crypto.randomUUID(),
    label: 'Nova pergunta',
    type: 'text',
    required: false,
  }
}

export function EvaluationFormTemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id
  const { data: existing, isLoading, isError, error } = useEvaluationFormTemplate(
    isNew ? undefined : id,
  )

  if (!isNew && isLoading) {
    return (
      <Loader2
        className="h-6 w-6 animate-spin text-muted-foreground"
        aria-label="A carregar modelo"
      />
    )
  }
  if (!isNew && isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{(error as Error).message}</AlertDescription>
      </Alert>
    )
  }
  if (!isNew && !existing) {
    return (
      <Alert variant="warning">
        <AlertDescription>Modelo não encontrado.</AlertDescription>
      </Alert>
    )
  }

  if (isNew) {
    return <TemplateEditorFields key="new" initial={null} />
  }

  return (
    <TemplateEditorFields
      key={existing!.id}
      templateId={existing!.id}
      initial={existing!}
    />
  )
}

function TemplateEditorFields({
  templateId,
  initial,
}: {
  templateId?: string
  initial: {
    id: string
    title: string
    description: string | null
    schema: unknown
  } | null
}) {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const { create, update } = useEvaluationFormTemplateMutations()
  const isNew = !initial

  const [title, setTitle] = useState(() => initial?.title ?? 'Novo modelo de ficha')
  const [description, setDescription] = useState(() => initial?.description ?? '')
  const [fields, setFields] = useState<FormFieldSchema[]>(() =>
    initial ? parseEvaluationSchema(initial.schema as import('@/types/database.types').Json) : [newField()],
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
          description: description.trim() || null,
          schema: fields,
        })
        showSuccess('Modelo criado.')
        void navigate(`/evaluation-forms/${row.id}/edit`)
      } else if (templateId) {
        await update.mutateAsync({
          id: templateId,
          title: title.trim(),
          description: description.trim() || null,
          schema: fields,
        })
        showSuccess('Alterações guardadas.')
      }
    } catch (err) {
      showError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  const pending = create.isPending || update.isPending
  const err = create.error ?? update.error

  const crumbs = isNew
    ? [
        { label: 'Painel', to: '/' },
        { label: 'Fichas de avaliação', to: '/evaluation-forms' },
        { label: 'Novo modelo' },
      ]
    : [
        { label: 'Painel', to: '/' },
        { label: 'Fichas de avaliação', to: '/evaluation-forms' },
        { label: title.trim() || 'Modelo' },
      ]

  return (
    <div>
      <PageHeader
        breadcrumbs={crumbs}
        title={isNew ? 'Novo modelo de ficha' : 'Editar modelo de ficha'}
      />
      <ApiConfigAlert />
      {err ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{(err as Error).message}</AlertDescription>
        </Alert>
      ) : null}
      <form onSubmit={handleSubmit}>
        <div className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="template-title">Título do modelo</Label>
            <Input
              id="template-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-description">Descrição (opcional)</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-semibold text-foreground">Campos da ficha</h3>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFields((f) => [...f, newField()])}
            >
              <Plus className="h-4 w-4" />
              Adicionar campo
            </Button>
          </div>
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-start"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor={`label-${field.id}`}>Texto da pergunta</Label>
                <Input
                  id={`label-${field.id}`}
                  value={field.label}
                  onChange={(e) => updateField(index, { label: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:w-40">
                <Label htmlFor={`type-${field.id}`}>Tipo</Label>
                <Select
                  value={field.type}
                  onValueChange={(v) =>
                    updateField(index, { type: v as FormFieldSchema['type'] })
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
                <Label htmlFor={`options-${field.id}`}>Opções (separadas por vírgula)</Label>
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
                className="mt-7 shrink-0 text-destructive"
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
            <Button variant="outline" asChild>
              <Link to="/evaluation-forms">Voltar</Link>
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
