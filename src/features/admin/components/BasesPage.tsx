import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { GlassPanel, PageHeader } from '@/components/AppShell'
import { toastSuccess } from '@/components/toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
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
    <div>
      <PageHeader breadcrumbs={[{ label: 'Bases' }]} title="Bases" />

      {isError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 className="mb-4 text-base font-semibold text-foreground">Bases existentes</h2>

          <GlassPanel className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Terapeuta</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 text-right font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 4 }, (_, i) => (
                      <tr key={i} className="border-b border-border/40">
                        {Array.from({ length: 4 }, (_, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-5 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : null}
                {!isLoading && data?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                      Nenhuma base registada.
                    </td>
                  </tr>
                ) : null}
                {!isLoading && data && data.length > 0
                  ? data.map((ws) => (
                      <tr
                        key={ws.id}
                        className="border-b border-border/40 last:border-0 hover:bg-accent/30"
                      >
                        <td className="px-4 py-3">{ws.name}</td>
                        <td className="px-4 py-3">{ws.owner_name ?? '—'}</td>
                        <td className="px-4 py-3">{ws.owner_email ?? '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" onClick={() => handleEnter(ws.id)}>
                            Entrar
                          </Button>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </GlassPanel>
        </div>

        <div className="lg:col-span-5">
          <GlassPanel>
            <h2 className="mb-4 text-base font-semibold text-foreground">Criar base</h2>

            {createError ? (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            ) : null}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Nome da base</Label>
                <Input
                  id="workspace-name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="therapist-name">Nome do terapeuta</Label>
                <Input
                  id="therapist-name"
                  value={therapistName}
                  onChange={(e) => setTherapistName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="therapist-email">E-mail do terapeuta</Label>
                <Input
                  id="therapist-email"
                  type="email"
                  value={therapistEmail}
                  onChange={(e) => setTherapistEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="therapist-password">Senha do terapeuta</Label>
                <Input
                  id="therapist-password"
                  type="password"
                  value={therapistPassword}
                  onChange={(e) => setTherapistPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit || create.isPending}
              >
                {create.isPending ? 'A criar…' : 'Criar base'}
              </Button>
            </form>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
