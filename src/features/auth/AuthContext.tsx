import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { ApiError, apiRequest } from '../../lib/apiClient'
import {
  clearSession,
  getActiveWorkspaceId,
  getStoredUser,
  getToken,
  setActiveWorkspaceId as persistActiveWorkspaceId,
  setSession,
  type StoredUser,
} from './authStorage'

type LoginResponse = {
  accessToken: string
  user: StoredUser
}

type AuthContextValue = {
  user: StoredUser | null
  token: string | null
  activeWorkspaceId: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  enterWorkspace: (id: string) => void
  isAuthenticated: boolean
  isSuperAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readInitialAuth() {
  return {
    user: getStoredUser(),
    token: getToken(),
    activeWorkspaceId: getActiveWorkspaceId(),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = readInitialAuth()
  const [user, setUser] = useState<StoredUser | null>(initial.user)
  const [token, setToken] = useState<string | null>(initial.token)
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(
    initial.activeWorkspaceId,
  )

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      auth: false,
    })
    if (error || !data) {
      throw error ?? new ApiError('Falha no login', 0)
    }
    setSession(data.accessToken, data.user)
    setToken(data.accessToken)
    setUser(data.user)
    setActiveWorkspaceIdState(getActiveWorkspaceId())
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setToken(null)
    setUser(null)
    setActiveWorkspaceIdState(null)
  }, [])

  const enterWorkspace = useCallback((id: string) => {
    persistActiveWorkspaceId(id)
    setActiveWorkspaceIdState(id)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      activeWorkspaceId,
      login,
      logout,
      enterWorkspace,
      isAuthenticated: Boolean(token),
      isSuperAdmin: user?.role === 'super_admin',
    }),
    [user, token, activeWorkspaceId, login, logout, enterWorkspace],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
