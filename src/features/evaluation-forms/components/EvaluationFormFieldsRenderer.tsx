import { MenuItem, Stack, TextField } from '@mui/material'

import type { FormFieldSchema } from '../../../types/database.types'

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
    <Stack spacing={2}>
      {fields.map((field) => {
        const value = answers[field.id] ?? ''
        const common = {
          label: field.label,
          value,
          required: field.required,
          fullWidth: true,
          slotProps: readOnly ? { input: { readOnly: true } } : undefined,
        }

        if (field.type === 'textarea') {
          return (
            <TextField
              key={field.id}
              {...common}
              multiline
              minRows={3}
              onChange={
                readOnly
                  ? undefined
                  : (e) => onChange?.(field.id, e.target.value)
              }
            />
          )
        }

        if (field.type === 'select') {
          return (
            <TextField
              key={field.id}
              {...common}
              select
              onChange={
                readOnly
                  ? undefined
                  : (e) => onChange?.(field.id, e.target.value)
              }
            >
              <MenuItem value="">
                <em>Selecionar…</em>
              </MenuItem>
              {(field.options ?? []).map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>
          )
        }

        return (
          <TextField
            key={field.id}
            {...common}
            type={
              field.type === 'number'
                ? 'number'
                : field.type === 'date'
                  ? 'date'
                  : 'text'
            }
            slotProps={{
              ...common.slotProps,
              inputLabel: field.type === 'date' ? { shrink: true } : undefined,
            }}
            onChange={
              readOnly ? undefined : (e) => onChange?.(field.id, e.target.value)
            }
          />
        )
      })}
    </Stack>
  )
}
