import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { queryKeys } from '../../../lib/queryKeys'
import { isSupabaseConfigured } from '../../../lib/supabaseClient'
import type { FormFieldSchema, Json } from '../../../types/database.types'
import {
  fetchPublicFormByToken,
  submitPublicForm,
} from '../../form-builder/services/formsApi'

export function PublicFormPage() {
  const { token } = useParams<{ token: string }>()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)

  const formQuery = useQuery({
    queryKey: queryKeys.publicForm(token ?? ''),
    queryFn: () => fetchPublicFormByToken(token!),
    enabled: Boolean(token) && isSupabaseConfigured(),
  })

  const submit = useMutation({
    mutationFn: async (payload: { token: string; answers: Json }) => {
      const { data, error } = await submitPublicForm(
        payload.token,
        payload.answers,
      )
      if (error) throw error
      return data
    },
    onSuccess: () => setDone(true),
  })

  const fields: FormFieldSchema[] = useMemo(
    () => formQuery.data?.schema ?? [],
    [formQuery.data?.schema],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    for (const f of fields) {
      if (f.required && !answers[f.id]?.trim()) return
    }
    const obj: Record<string, string> = {}
    for (const f of fields) {
      obj[f.label] = answers[f.id] ?? ''
    }
    void submit.mutateAsync({ token, answers: obj as Json })
  }

  if (!isSupabaseConfigured()) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning">Configuração em falta.</Alert>
      </Box>
    )
  }

  if (!token) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Link inválido.</Alert>
      </Box>
    )
  }

  if (formQuery.isLoading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (formQuery.isError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{(formQuery.error as Error).message}</Alert>
      </Box>
    )
  }

  if (!formQuery.data) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">Formulário não encontrado ou expirado.</Alert>
      </Box>
    )
  }

  if (done) {
    return (
      <Box sx={{ p: 2, maxWidth: 560, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Obrigado
        </Typography>
        <Typography>A sua resposta foi registada.</Typography>
      </Box>
    )
  }

  return (
    <Box
      component="main"
      sx={{
        p: 2,
        maxWidth: 560,
        mx: 'auto',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <Typography variant="h5" component="h1" gutterBottom>
        {formQuery.data.title}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          {fields.map((field) => (
            <FieldInput
              key={field.id}
              field={field}
              value={answers[field.id] ?? ''}
              onChange={(v) =>
                setAnswers((prev) => ({ ...prev, [field.id]: v }))
              }
            />
          ))}
          {submit.error ? (
            <Alert severity="error">
              {(submit.error as Error).message}
            </Alert>
          ) : null}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submit.isPending}
          >
            Enviar
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormFieldSchema
  value: string
  onChange: (v: string) => void
}) {
  if (field.type === 'textarea') {
    return (
      <TextField
        label={field.label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        multiline
        minRows={3}
        fullWidth
      />
    )
  }
  if (field.type === 'number') {
    return (
      <TextField
        label={field.label}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        fullWidth
      />
    )
  }
  if (field.type === 'date') {
    return (
      <TextField
        label={field.label}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        fullWidth
        slotProps={{ inputLabel: { shrink: true } }}
      />
    )
  }
  if (field.type === 'select' && field.options?.length) {
    return (
      <TextField
        select
        label={field.label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        fullWidth
      >
        {field.options.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </TextField>
    )
  }
  return (
    <TextField
      label={field.label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={field.required}
      fullWidth
    />
  )
}
