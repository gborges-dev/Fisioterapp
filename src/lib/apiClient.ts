import { clearSession, getActiveWorkspaceId, getToken } from '../features/auth/authStorage'

const baseUrl = () => (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export function isApiConfigured() {
  return Boolean(baseUrl())
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type ApiResult<T> = { data: T | null; error: ApiError | null }

export async function apiRequest<T>(
  path: string,
  init: RequestInit & { workspaceId?: string | null; auth?: boolean } = {},
): Promise<ApiResult<T>> {
  try {
    const headers = new Headers(init.headers)
    if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }
    if (init.auth !== false) {
      const token = getToken()
      if (token) headers.set('Authorization', `Bearer ${token}`)
    }
    const ws = init.workspaceId ?? getActiveWorkspaceId()
    if (ws) headers.set('X-Workspace-Id', ws)

    const res = await fetch(`${baseUrl()}${path.startsWith('/') ? path : `/${path}`}`, {
      ...init,
      headers,
    })
    if (res.status === 401) {
      clearSession()
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/f/')) {
        window.location.assign('/login')
      }
    }
    if (!res.ok) {
      let body: unknown = null
      try {
        body = await res.json()
      } catch {
        /* ignore */
      }
      const message =
        typeof body === 'object' && body && 'message' in body
          ? String((body as { message: string }).message)
          : res.statusText
      return { data: null, error: new ApiError(message, res.status, body) }
    }
    if (res.status === 204) return { data: null, error: null }
    const data = (await res.json()) as T
    return { data, error: null }
  } catch (e) {
    return {
      data: null,
      error: new ApiError(e instanceof Error ? e.message : 'Network error', 0),
    }
  }
}
