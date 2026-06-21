import { Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, MenuItem, Stack, TextField, Typography } from '@mui/material'
import type { ReactNode } from 'react'

import {
  formatMultiselectDisplay,
  parseMultiselectAnswer,
  serializeMultiselectAnswer,
} from '../../../lib/formAnswers'
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

        if (field.type === 'multiselect') {
          const selected = parseMultiselectAnswer(value)

          if (readOnly) {
            return (
              <BoxField key={field.id} label={field.label} required={field.required}>
                <Typography variant="body2" color="text.secondary">
                  {formatMultiselectDisplay(value) || '—'}
                </Typography>
              </BoxField>
            )
          }

          return (
            <FormControl key={field.id} required={field.required} fullWidth>
              <FormLabel>{field.label}</FormLabel>
              <FormGroup>
                {(field.options ?? []).map((opt) => (
                  <FormControlLabel
                    key={opt}
                    control={
                      <Checkbox
                        checked={selected.includes(opt)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...selected, opt]
                            : selected.filter((s) => s !== opt)
                          onChange?.(field.id, serializeMultiselectAnswer(next))
                        }}
                      />
                    }
                    label={opt}
                  />
                ))}
              </FormGroup>
            </FormControl>
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

function BoxField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <FormControl fullWidth required={required}>
      <FormLabel sx={{ mb: 0.5 }}>{label}</FormLabel>
      {children}
    </FormControl>
  )
}
