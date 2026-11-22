import { Activity, CircleAlert, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

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
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="flex min-h-svh flex-col md:flex-row">
      <section className="flex flex-col justify-between gap-12 bg-primary px-6 py-8 text-primary-foreground md:flex-1 md:px-16 md:py-14">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-card text-primary"
            aria-hidden
          >
            <Activity className="h-6 w-6" />
          </span>
          <span className="display text-[26px] font-semibold leading-none">Fisioterapp</span>
        </div>
        <div className="hidden md:block">
          <svg
            width="100%"
            height="64"
            viewBox="0 0 520 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-8 max-w-[520px] opacity-50"
            aria-hidden
          >
            <path d="M0 32h150l22-26 34 52 30-40 22 14h262" />
          </svg>
          <p className="display max-w-[520px] text-5xl font-medium leading-[1.12]">
            Pacientes, evolução e financeiro em um só lugar.
          </p>
        </div>
        <p className="hidden text-sm opacity-80 md:block">Área clínica · acesso restrito</p>
      </section>

      <section className="flex flex-1 items-center justify-center px-6 py-10 md:px-8">
        <form onSubmit={handleSubmit} className="w-full max-w-[400px] space-y-5">
          <div>
            <h1 className="display text-4xl font-semibold leading-tight">Entrar</h1>
            <p className="mt-1.5 text-muted-foreground">
              Use o e-mail e a senha da sua conta.
            </p>
          </div>

          {error ? (
            <Alert variant="destructive">
              <CircleAlert className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold">
              E-mail
            </Label>
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
            <Label htmlFor="password" className="text-sm font-semibold">
              Senha
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                className="pr-14"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0.5 top-0.5 text-muted-foreground"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting || !email.trim() || !password}
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </section>
    </div>
  )
}
