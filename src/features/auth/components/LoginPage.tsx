import { CircleAlert } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { GlassPanel } from '@/components/AppShell'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/apiClient'
import { useAuth } from '../AuthContext'
import { getActiveWorkspaceId, getStoredUser } from '../authStorage'

export function LoginPage() {
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    if (user?.role === 'super_admin' && !getActiveWorkspaceId()) {
      return <Navigate to="/admin/bases" replace />
    }
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      const stored = getStoredUser()
      if (stored?.role === 'super_admin' && !getActiveWorkspaceId()) {
        navigate('/admin/bases')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-svh place-items-center px-4">
      <GlassPanel className="w-full max-w-md p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="text-sm text-muted-foreground">Área clínica</p>
            <h1 className="display mt-1 text-2xl font-semibold tracking-tight">
              Entrar no Fisioterapp
            </h1>
          </div>

          {error ? (
            <Alert variant="destructive">
              <CircleAlert className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting || !email.trim() || !password}
          >
            {submitting ? 'A entrar…' : 'Entrar'}
          </Button>
        </form>
      </GlassPanel>
    </div>
  )
}
