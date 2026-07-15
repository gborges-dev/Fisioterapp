import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../AuthContext'

export function SuperAdminRoute() {
  const { isSuperAdmin } = useAuth()
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
