import { Loader2 } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { GlassPanel } from '@/components/AppShell'
import { toastError, toastSuccess } from '@/components/toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  parseMultiselectAnswer,
  serializeMultiselectAnswer,
} from '@/lib/formAnswers'
import { validateRequiredFields } from '@/lib/formFieldValidation'
import { isApiConfigured } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'
import type { FormFieldSchema, Json } from '@/types/database.types'
import {
  fetchPublicFormByToken,
  submitPublicForm,
} from '../../form-builder/services/formsApi'

export function PublicFormPage() {
  const { token } = useParams<{ token: string }>()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)

  const formQuery = useQuery({
    queryKey: queryKeys.publicForm(token ?? ''),
    queryFn: async () => {
      const { data, error } = await fetchPublicFormByToken(token!)
      if (error) throw error
      return data
    },
    enabled: Boolean(token) && isApiConfigured(),
  })

  const submit = useMutation({
    mutationFn: async (payload: { token: string; answers: Json }) => {
      const { data, error } = await submitPublicForm(
        payload.token,
        payload.answers,
      )
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toastSuccess('Resposta enviada com sucesso.')
      setDone(true)
    },
    onError: (err) => {
      toastError(err instanceof Error ? err : new Error(String(err)))
    },
  })

  const fields: FormFieldSchema[] = useMemo(
    () => formQuery.data?.schema ?? [],
    [formQuery.data?.schema],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    const validationError = validateRequiredFields(fields, answers)
    if (validationError) {
      toastError(new Error(validationError))
      return
    }
    const obj: Record<string, string> = {}
    for (const f of fields) {
      obj[f.label] = answers[f.id] ?? ''
    }
    void submit.mutateAsync({ token, answers: obj as Json })
  }

  if (!isApiConfigured()) {
    return (
      <div className="p-4">
        <Alert variant="warning">
          <AlertDescription>Configuração em falta.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertDescription>Link inválido.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (formQuery.isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (formQuery.isError) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertDescription>{(formQuery.error as Error).message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!formQuery.data) {
    return (
      <div className="p-4">
        <Alert>
          <AlertDescription>Formulário não encontrado ou expirado.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (done) {
    return (
      <main className="mx-auto min-h-svh max-w-lg p-4">
        <GlassPanel>
          <h1 className="display text-2xl font-semibold">Obrigado</h1>
          <p className="mt-2 text-muted-foreground">A sua resposta foi registada.</p>
        </GlassPanel>
      </main>
    )
  }

  return (
    <main className="mx-auto box-border min-h-svh max-w-lg p-4">
      <GlassPanel>
        <h1 className="display mb-6 text-2xl font-semibold">{formQuery.data.title}</h1>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {fields.map((field) => (
            <FieldInput
              key={field.id}
              field={field}
              value={answers[field.id] ?? ''}
              onChange={(v) =>
                setAnswers((prev) => ({ ...prev, [field.id]: v }))
              }
            />
          ))}
          {submit.error ? (
            <Alert variant="destructive">
              <AlertDescription>{(submit.error as Error).message}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" size="lg" className="w-full" disabled={submit.isPending}>
            {submit.isPending ? <Loader2 className="animate-spin" /> : null}
            Enviar
          </Button>
        </form>
      </GlassPanel>
    </main>
  )
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormFieldSchema
  value: string
  onChange: (v: string) => void
}) {
  const fieldId = `field-${field.id}`

  if (field.type === 'textarea') {
    return (
      <div className="space-y-2">
        <Label htmlFor={fieldId}>
          {field.label}
          {field.required ? ' *' : ''}
        </Label>
        <Textarea
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          rows={3}
        />
      </div>
    )
  }
  if (field.type === 'number') {
    return (
      <div className="space-y-2">
        <Label htmlFor={fieldId}>
          {field.label}
          {field.required ? ' *' : ''}
        </Label>
        <Input
          id={fieldId}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      </div>
    )
  }
  if (field.type === 'date') {
    return (
      <div className="space-y-2">
        <Label htmlFor={fieldId}>
          {field.label}
          {field.required ? ' *' : ''}
        </Label>
        <Input
          id={fieldId}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      </div>
    )
  }
  if (field.type === 'multiselect' && field.options?.length) {
    const selected = parseMultiselectAnswer(value)
    return (
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">
          {field.label}
          {field.required ? ' *' : ''}
        </legend>
        <div className="space-y-2">
          {field.options.map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <Checkbox
                id={`${fieldId}-${opt}`}
                checked={selected.includes(opt)}
                onCheckedChange={(checked) => {
                  const next = checked
                    ? [...selected, opt]
                    : selected.filter((s) => s !== opt)
                  onChange(serializeMultiselectAnswer(next))
                }}
              />
              <Label htmlFor={`${fieldId}-${opt}`} className="font-normal">
                {opt}
              </Label>
            </div>
          ))}
        </div>
      </fieldset>
    )
  }
  if (field.type === 'select' && field.options?.length) {
    return (
      <div className="space-y-2">
        <Label htmlFor={fieldId}>
          {field.label}
          {field.required ? ' *' : ''}
        </Label>
        <Select value={value} onValueChange={onChange} required={field.required}>
          <SelectTrigger id={fieldId}>
            <SelectValue placeholder="Selecionar…" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>
        {field.label}
        {field.required ? ' *' : ''}
      </Label>
      <Input
        id={fieldId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
      />
    </div>
  )
}
