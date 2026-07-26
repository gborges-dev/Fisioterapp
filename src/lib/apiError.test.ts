import { describe, expect, it } from 'vitest'

import { ApiError } from './apiClient'
import { getFriendlyErrorMessage, isNotFoundError } from './apiError'

describe('apiError', () => {
  it('mapeia 404 para mensagem amigável', () => {
    const err = new ApiError('Cannot GET /api/foo', 404)
    expect(isNotFoundError(err)).toBe(true)
    expect(getFriendlyErrorMessage(err)).toBe(
      'O conteúdo que procura não foi encontrado.',
    )
  })

  it('preserva mensagens de negócio conhecidas', () => {
    const err = new ApiError('Patient not found', 404)
    expect(getFriendlyErrorMessage(err)).toBe(
      'Paciente não encontrado ou já não está disponível.',
    )
  })
})
