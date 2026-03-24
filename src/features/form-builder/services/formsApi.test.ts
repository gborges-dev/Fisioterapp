import { describe, expect, it } from 'vitest'

import { parseFormSchema } from './formsApi'

describe('parseFormSchema', () => {
  it('devolve lista vazia para JSON inválido', () => {
    expect(parseFormSchema(null)).toEqual([])
    expect(parseFormSchema({})).toEqual([])
  })

  it('mapeia campos válidos', () => {
    const fields = parseFormSchema([
      { id: 'a', label: 'Nome', type: 'text', required: true },
    ])
    expect(fields).toHaveLength(1)
    expect(fields[0]).toMatchObject({
      id: 'a',
      label: 'Nome',
      type: 'text',
      required: true,
    })
  })
})
