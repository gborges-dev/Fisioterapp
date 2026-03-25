import { calculateAge } from './age'

/** Data de nascimento opcional; se preenchida, deve ser uma data válida. */
export function isOptionalBirthDateValid(value: string): boolean {
  const t = value.trim()
  if (!t) return true
  return calculateAge(t) !== null
}
