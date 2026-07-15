import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { ApiError } from '../../../lib/apiClient'
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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        background: (t) =>
          `linear-gradient(180deg, ${t.palette.background.default} 0%, ${t.palette.background.paper} 48%)`,
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={2}
        sx={{ width: '100%', maxWidth: 420, p: { xs: 3, sm: 4 } }}
      >
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Área clínica
            </Typography>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
              Entrar no Fisioterapp
            </Typography>
          </Box>

          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="E-mail"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Senha"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
            fullWidth
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting || !email.trim() || !password}
            fullWidth
          >
            {submitting ? 'A entrar…' : 'Entrar'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
