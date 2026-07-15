import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PageBreadcrumbs } from '../../../components/PageBreadcrumbs'
import { toastSuccess } from '../../../components/toast'
import { useAuth } from '../../auth/AuthContext'
import { createWorkspace, listWorkspaces } from '../services/adminApi'

const WORKSPACES_QUERY_KEY = ['admin', 'workspaces'] as const

export function BasesPage() {
  const { enterWorkspace } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: WORKSPACES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await listWorkspaces()
      if (error) throw error
      return data ?? []
    },
  })

  const [workspaceName, setWorkspaceName] = useState('')
  const [therapistName, setTherapistName] = useState('')
  const [therapistEmail, setTherapistEmail] = useState('')
  const [therapistPassword, setTherapistPassword] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await createWorkspace({
        workspaceName: workspaceName.trim(),
        therapist: {
          name: therapistName.trim(),
          email: therapistEmail.trim(),
          password: therapistPassword,
        },
      })
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: WORKSPACES_QUERY_KEY })
      setWorkspaceName('')
      setTherapistName('')
      setTherapistEmail('')
      setTherapistPassword('')
      setCreateError(null)
      toastSuccess('Base criada com sucesso.')
    },
    onError: (err) => {
      const msg =
        err instanceof Error ? err.message : 'Não foi possível criar a base.'
      setCreateError(msg)
    },
  })

  const handleEnter = (id: string) => {
    enterWorkspace(id)
    navigate('/')
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    create.mutate()
  }

  const canSubmit =
    workspaceName.trim() &&
    therapistName.trim() &&
    therapistEmail.trim() &&
    therapistPassword

  return (
    <Box>
      <PageBreadcrumbs items={[{ label: 'Bases' }]} />

      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Bases
      </Typography>

      {isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(error as Error).message}
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Bases existentes
          </Typography>

          <TableContainer component={Card} variant="outlined">
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Terapeuta</TableCell>
                  <TableCell>E-mail</TableCell>
                  <TableCell align="right">Ação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 4 }, (_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 4 }, (_, j) => (
                          <TableCell key={j}>
                            <Skeleton />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : null}
                {!isLoading && data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography color="text.secondary">
                        Nenhuma base registada.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
                {!isLoading && data && data.length > 0
                  ? data.map((ws) => (
                      <TableRow key={ws.id} hover>
                        <TableCell>{ws.name}</TableCell>
                        <TableCell>{ws.owner_name ?? '—'}</TableCell>
                        <TableCell>{ws.owner_email ?? '—'}</TableCell>
                        <TableCell align="right">
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleEnter(ws.id)}
                          >
                            Entrar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                Criar base
              </Typography>

              {createError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {createError}
                </Alert>
              ) : null}

              <Box component="form" onSubmit={handleCreate}>
                <Stack spacing={2}>
                  <TextField
                    label="Nome da base"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Nome do terapeuta"
                    value={therapistName}
                    onChange={(e) => setTherapistName(e.target.value)}
                    required
                    fullWidth
                  />
                  <TextField
                    label="E-mail do terapeuta"
                    type="email"
                    value={therapistEmail}
                    onChange={(e) => setTherapistEmail(e.target.value)}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Senha do terapeuta"
                    type="password"
                    value={therapistPassword}
                    onChange={(e) => setTherapistPassword(e.target.value)}
                    required
                    fullWidth
                    autoComplete="new-password"
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!canSubmit || create.isPending}
                    fullWidth
                  >
                    {create.isPending ? 'A criar…' : 'Criar base'}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
