import type { ReactNode } from 'react'

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
  formatMultiselectDisplay,
  parseMultiselectAnswer,
  serializeMultiselectAnswer,
} from '@/lib/formAnswers'
import type { FormFieldSchema } from '@/types/database.types'

export function EvaluationFormFieldsRenderer({
  fields,
  answers,
  onChange,
  readOnly = false,
}: {
  fields: FormFieldSchema[]
  answers: Record<string, string>
  onChange?: (fieldId: string, value: string) => void
  readOnly?: boolean
}) {
  if (fields.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const value = answers[field.id] ?? ''

        if (field.type === 'textarea') {
          return (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>
                {field.label}
                {field.required ? ' *' : ''}
              </Label>
              <Textarea
                id={field.id}
                value={value}
                required={field.required}
                readOnly={readOnly}
                rows={3}
                onChange={
                  readOnly
                    ? undefined
                    : (e) => onChange?.(field.id, e.target.value)
                }
              />
            </div>
          )
        }

        if (field.type === 'select') {
          if (readOnly) {
            return (
              <FieldBox key={field.id} label={field.label} required={field.required}>
                <p className="text-sm text-muted-foreground">{value || '—'}</p>
              </FieldBox>
            )
          }
          return (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>
                {field.label}
                {field.required ? ' *' : ''}
              </Label>
              <Select
                value={value || undefined}
                onValueChange={(v) => onChange?.(field.id, v)}
                required={field.required}
              >
                <SelectTrigger id={field.id}>
                  <SelectValue placeholder="Selecionar…" />
                </SelectTrigger>
                <SelectContent>
                  {(field.options ?? []).map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }

        if (field.type === 'multiselect') {
          const selected = parseMultiselectAnswer(value)

          if (readOnly) {
            return (
              <FieldBox key={field.id} label={field.label} required={field.required}>
                <p className="text-sm text-muted-foreground">
                  {formatMultiselectDisplay(value) || '—'}
                </p>
              </FieldBox>
            )
          }

          return (
            <div key={field.id} className="space-y-2">
              <Label>
                {field.label}
                {field.required ? ' *' : ''}
              </Label>
              <div className="space-y-2">
                {(field.options ?? []).map((opt) => (
                  <div key={opt} className="flex items-center gap-2">
                    <Checkbox
                      id={`${field.id}-${opt}`}
                      checked={selected.includes(opt)}
                      onCheckedChange={(checked) => {
                        const next = checked
                          ? [...selected, opt]
                          : selected.filter((s) => s !== opt)
                        onChange?.(field.id, serializeMultiselectAnswer(next))
                      }}
                    />
                    <Label
                      htmlFor={`${field.id}-${opt}`}
                      className="cursor-pointer font-normal"
                    >
                      {opt}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required ? ' *' : ''}
            </Label>
            <Input
              id={field.id}
              type={
                field.type === 'number'
                  ? 'number'
                  : field.type === 'date'
                    ? 'date'
                    : 'text'
              }
              value={value}
              required={field.required}
              readOnly={readOnly}
              onChange={
                readOnly ? undefined : (e) => onChange?.(field.id, e.target.value)
              }
            />
          </div>
        )
      })}
    </div>
  )
}

function FieldBox({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label>
        {label}
        {required ? ' *' : ''}
      </Label>
      {children}
    </div>
  )
}
