import { describe, expect, it } from 'vitest'

import {
  formatMultiselectDisplay,
  parseMultiselectAnswer,
  serializeMultiselectAnswer,
} from './formAnswers'

describe('formAnswers multiselect', () => {
  it('serializa e parseia array JSON', () => {
    const raw = serializeMultiselectAnswer(['Dor', 'Edema'])
    expect(parseMultiselectAnswer(raw)).toEqual(['Dor', 'Edema'])
    expect(formatMultiselectDisplay(raw)).toBe('Dor, Edema')
  })

  it('tolera string vazia', () => {
    expect(parseMultiselectAnswer('')).toEqual([])
    expect(formatMultiselectDisplay('')).toBe('')
  })

  it('tolera formato legado separado por vírgula', () => {
    expect(parseMultiselectAnswer('A, B')).toEqual(['A', 'B'])
  })
})
