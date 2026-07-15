const TOKEN_KEY = 'fisioterapp_token'
const USER_KEY = 'fisioterapp_user'
const WS_KEY = 'fisioterapp_active_workspace'

export type StoredUser = {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'therapist'
  workspaceId: string | null
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
export function setSession(token: string, user: StoredUser, activeWorkspaceId?: string | null) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  const ws = activeWorkspaceId ?? user.workspaceId ?? null
  if (ws) localStorage.setItem(WS_KEY, ws)
  else localStorage.removeItem(WS_KEY)
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(WS_KEY)
}
export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}
export function getActiveWorkspaceId(): string | null {
  return localStorage.getItem(WS_KEY)
}
export function setActiveWorkspaceId(id: string) {
  localStorage.setItem(WS_KEY, id)
}
