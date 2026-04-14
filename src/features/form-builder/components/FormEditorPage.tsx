import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { PageBreadcrumbs } from '../../../components/PageBreadcrumbs'
import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import { useToast } from '../../../components/toast'
import type { FormFieldSchema, Json } from '../../../types/database.types'
import { useFormTemplate, useFormTemplateMutations } from '../hooks/useFormTemplates'
import { parseFormSchema } from '../services/formsApi'

function newField(): FormFieldSchema {
  return {
    id: crypto.randomUUID(),
    label: 'Nova pergunta',
    type: 'text',
    required: false,
  }
}

type FormTemplateRow = {
  id: string
  title: string
  schema: unknown
}

export function FormEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id
  const { data: existing, isLoading, isError, error } = useFormTemplate(
    isNew ? undefined : id,
  )

  if (!isNew && isLoading) {
    return <CircularProgress aria-label="A carregar formulário" />
  }
  if (!isNew && isError) {
    return <Alert severity="error">{(error as Error).message}</Alert>
  }
  if (!isNew && !existing) {
    return <Alert severity="warning">Formulário não encontrado.</Alert>
  }

  if (isNew) {
    return <FormEditorFields key="new" initial={null} />
  }

  return (
    <FormEditorFields
      key={existing.id}
      templateId={existing.id}
      initial={{
        id: existing.id,
        title: existing.title,
        schema: existing.schema,
      }}
    />
  )
}

function FormEditorFields({
  templateId,
  initial,
}: {
  templateId?: string
  initial: FormTemplateRow | null
}) {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const { create, update } = useFormTemplateMutations()
  const isNew = !initial

  const [title, setTitle] = useState(
    () => initial?.title ?? 'Novo formulário',
  )
  const [fields, setFields] = useState<FormFieldSchema[]>(() =>
    initial ? parseFormSchema(initial.schema as Json) : [newField()],
  )

  const updateField = (index: number, patch: Partial<FormFieldSchema>) => {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    )
  }

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    try {
      if (isNew) {
        const row = await create.mutateAsync({
          title: title.trim(),
          schema: fields,
        })
        showSuccess('Formulário criado.')
        void navigate(`/forms/${row.id}/edit`)
      } else if (templateId) {
        await update.mutateAsync({
          id: templateId,
          title: title.trim(),
          schema: fields,
        })
        showSuccess('Alterações guardadas.')
      }
    } catch (e) {
      showError(e instanceof Error ? e : new Error(String(e)))
    }
  }

  const pending = create.isPending || update.isPending
  const err = create.error ?? update.error

  const crumbs = isNew
    ? [
        { label: 'Painel', to: '/' },
        { label: 'Formulários', to: '/forms' },
        { label: 'Novo formulário' },
      ]
    : [
        { label: 'Painel', to: '/' },
        { label: 'Formulários', to: '/forms' },
        { label: title.trim() || 'Formulário' },
      ]

  return (
    <Box>
      <PageBreadcrumbs items={crumbs} />
      <Typography variant="h4" component="h2" gutterBottom>
        {isNew ? 'Novo formulário' : 'Editar formulário'}
      </Typography>
      <SupabaseConfigAlert />
      {err ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(err as Error).message}
        </Alert>
      ) : null}
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3} sx={{ maxWidth: 720 }}>
          <TextField
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
          />
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle1">Campos</Typography>
            <Button
              type="button"
              startIcon={<AddIcon />}
              onClick={() => setFields((f) => [...f, newField()])}
            >
              Adicionar campo
            </Button>
          </Stack>
          {fields.map((field, index) => (
            <Stack
              key={field.id}
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ sm: 'flex-start' }}
            >
              <TextField
                label="Texto da pergunta"
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value })}
                fullWidth
                sx={{ flex: 1 }}
              />
              <FormControl sx={{ minWidth: 160 }}>
                <InputLabel id={`type-${field.id}`}>Tipo</InputLabel>
                <Select
                  labelId={`type-${field.id}`}
                  label="Tipo"
                  value={field.type}
                  onChange={(e) =>
                    updateField(index, {
                      type: e.target.value as FormFieldSchema['type'],
                    })
                  }
                >
                  <MenuItem value="text">Texto curto</MenuItem>
                  <MenuItem value="textarea">Texto longo</MenuItem>
                  <MenuItem value="number">Número</MenuItem>
                  <MenuItem value="date">Data</MenuItem>
                  <MenuItem value="select">Escolha</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Opções (separadas por vírgula)"
                value={(field.options ?? []).join(', ')}
                onChange={(e) =>
                  updateField(index, {
                    options: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                disabled={field.type !== 'select'}
                fullWidth
                sx={{ flex: 1 }}
              />
              <Button
                type="button"
                color="error"
                aria-label="Remover campo"
                onClick={() => removeField(index)}
              >
                <DeleteOutlineIcon />
              </Button>
            </Stack>
          ))}
          <Stack direction="row" spacing={2}>
            <Button type="submit" variant="contained" disabled={pending}>
              Guardar
            </Button>
            <Button component={Link} to="/forms">
              Voltar
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}
