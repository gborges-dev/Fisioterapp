import { describe, expect, it } from 'vitest'

import { isOptionalBirthDateValid } from './patientStepValidation'

describe('isOptionalBirthDateValid', () => {
  it('aceita vazio', () => {
    expect(isOptionalBirthDateValid('')).toBe(true)
    expect(isOptionalBirthDateValid('  ')).toBe(true)
  })

  it('aceita data válida', () => {
    expect(isOptionalBirthDateValid('1990-05-20')).toBe(true)
  })

  it('rejeita data inválida', () => {
    expect(isOptionalBirthDateValid('invalid')).toBe(false)
  })
})
