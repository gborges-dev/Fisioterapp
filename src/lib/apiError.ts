import { ApiError } from './apiClient'

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function getApiErrorStatus(error: unknown): number | null {
  return isApiError(error) ? error.status : null
}

export function isNotFoundError(error: unknown): boolean {
  return getApiErrorStatus(error) === 404
}

export function isForbiddenError(error: unknown): boolean {
  return getApiErrorStatus(error) === 403
}

export function isUnauthorizedError(error: unknown): boolean {
  return getApiErrorStatus(error) === 401
}

/** Mensagem amigável para exibir na UI (nunca mostra "404" ou paths técnicos crus). */
export function getFriendlyErrorMessage(
  error: unknown,
  fallback = 'Ocorreu um erro inesperado. Tente novamente.',
): string {
  if (!error) return fallback

  const status = getApiErrorStatus(error)
  const raw =
    error instanceof Error ? error.message.trim() : String(error).trim()

  if (status === 404) {
    if (/patient not found/i.test(raw)) {
      return 'Paciente não encontrado ou já não está disponível.'
    }
    if (/evaluation form|ficha/i.test(raw)) {
      return 'Ficha de avaliação não encontrada.'
    }
    if (/evolution entry|evolução/i.test(raw)) {
      return 'Registo de evolução não encontrado.'
    }
    return 'O conteúdo que procura não foi encontrado.'
  }

  if (status === 403) {
    return 'Não tem permissão para aceder a este conteúdo.'
  }

  if (status === 401) {
    return 'Sessão expirada. Inicie sessão novamente.'
  }

  if (status === 0) {
    return 'Não foi possível ligar ao servidor. Verifique a ligação à internet.'
  }

  if (/cannot (get|post|patch|delete|put)/i.test(raw)) {
    return 'Serviço temporariamente indisponível. Tente novamente dentro de momentos.'
  }

  if (raw && status !== 404) {
    return raw
  }

  return fallback
}
