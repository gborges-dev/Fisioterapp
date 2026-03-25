import { describe, expect, it } from 'vitest'

import { calculateAge } from './age'

describe('calculateAge', () => {
  it('calcula idade corretamente', () => {
    const ref = new Date('2026-06-15T12:00:00')
    expect(calculateAge('2000-01-01', ref)).toBe(26)
    expect(calculateAge('2000-06-20', ref)).toBe(25)
  })

  it('devolve null para data vazia ou inválida', () => {
    expect(calculateAge('', new Date())).toBeNull()
    expect(calculateAge('   ', new Date())).toBeNull()
    expect(calculateAge('não-é-data', new Date())).toBeNull()
  })
})
