import type { FormFieldSchema } from '../types/database.types'
import { parseMultiselectAnswer } from './formAnswers'

export function isOptionFieldType(type: FormFieldSchema['type']): boolean {
  return type === 'select' || type === 'multiselect'
}

export function isFieldValueEmpty(
  field: FormFieldSchema,
  value: string | undefined,
): boolean {
  if (field.type === 'multiselect') {
    return parseMultiselectAnswer(value ?? '').length === 0
  }
  return !(value ?? '').trim()
}

export function validateRequiredFields(
  fields: FormFieldSchema[],
  answers: Record<string, string>,
): string | null {
  for (const f of fields) {
    if (f.required && isFieldValueEmpty(f, answers[f.id])) {
      if (f.type === 'multiselect') {
        return `Selecione pelo menos uma opção em «${f.label}».`
      }
      return `O campo "${f.label}" é obrigatório.`
    }
  }
  return null
}

export function validateOptionFields(fields: FormFieldSchema[]): string | null {
  for (const f of fields) {
    if (!isOptionFieldType(f.type)) continue
    const options = (f.options ?? []).filter((o) => o.trim())
    if (options.length < 2) {
      return `O campo "${f.label}" precisa de pelo menos 2 opções.`
    }
  }
  return null
}
