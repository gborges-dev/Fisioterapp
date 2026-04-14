import { parseFormSchema } from '../../form-builder/services/formsApi'
import type { Json } from '../../../types/database.types'

function valueToString(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não'
  if (Array.isArray(v)) return v.map((x) => String(x)).join(', ')
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

/**
 * Obtém valor guardado por `id` (submissões futuras), por `label` ou por chave
 * com o mesmo texto após trim (rótulo ligeiramente diferente).
 */
function pickAnswerValue(
  answers: Record<string, unknown>,
  fieldId: string,
  fieldLabel: string,
): { value: unknown; consumedKey: string | null } {
  if (Object.prototype.hasOwnProperty.call(answers, fieldId)) {
    return { value: answers[fieldId], consumedKey: fieldId }
  }
  if (Object.prototype.hasOwnProperty.call(answers, fieldLabel)) {
    return { value: answers[fieldLabel], consumedKey: fieldLabel }
  }
  const labelNorm = fieldLabel.trim()
  for (const key of Object.keys(answers)) {
    if (key.trim() === labelNorm) {
      return { value: answers[key], consumedKey: key }
    }
  }
  return { value: undefined, consumedKey: null }
}

/** Texto legível para coluna de resumo (rótulos do schema). */
export function formatSubmissionAnswersSummary(
  schemaJson: Json,
  answers: Record<string, unknown>,
): string {
  const fields = parseFormSchema(schemaJson)
  const parts: string[] = []
  const usedKeys = new Set<string>()

  for (const f of fields) {
    const { value: v, consumedKey } = pickAnswerValue(
      answers,
      f.id,
      f.label,
    )
    if (consumedKey) usedKeys.add(consumedKey)
    if (v === undefined || v === null || v === '') continue
    const s = valueToString(v)
    if (!s) continue
    parts.push(`${f.label}: ${s}`)
  }

  for (const key of Object.keys(answers)) {
    if (usedKeys.has(key)) continue
    const v = answers[key]
    if (v === undefined || v === null || v === '') continue
    const s = valueToString(v)
    if (!s) continue
    parts.push(`${key}: ${s}`)
  }

  return parts.length > 0 ? parts.join(' · ') : '—'
}
