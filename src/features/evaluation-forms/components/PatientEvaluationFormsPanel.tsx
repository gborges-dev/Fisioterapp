import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Alert,
  Box,
  Button,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { ConfirmDeleteDialog } from '../../../components/ConfirmDeleteDialog'
import { ListCard } from '../../../components/ListCard'
import { ListPageSkeleton } from '../../../components/ListPageSkeleton'
import { SupabaseConfigAlert } from '../../../components/SupabaseConfigAlert'
import {
  useDeletePatientEvaluationForm,
  usePatientEvaluationForms,
} from '../hooks/usePatientEvaluationForms'
import { countEvolutionEntriesByFormId } from '../services/evaluationFormsApi'
import type { PatientEvaluationFormRow } from '../types'

function formatDate(iso: string) {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function PatientEvaluationFormsPanel({
  patientId,
}: {
  patientId: string
}) {
  const { data, isLoading, isError, error } = usePatientEvaluationForms(patientId)
  const remove = useDeletePatientEvaluationForm(patientId)
  const [formToDelete, setFormToDelete] = useState<PatientEvaluationFormRow | null>(
    null,
  )
  const [evolutionCount, setEvolutionCount] = useState(0)
  const [loadingCount, setLoadingCount] = useState(false)

  const openDeleteDialog = async (form: PatientEvaluationFormRow) => {
    setFormToDelete(form)
    setLoadingCount(true)
    try {
      const { data, error: countError } =
        await countEvolutionEntriesByFormId(form.id)
      if (countError) throw countError
      setEvolutionCount(data?.count ?? 0)
    } catch {
      setEvolutionCount(0)
    } finally {
      setLoadingCount(false)
    }
  }

  const confirmDelete = async () => {
    if (!formToDelete) return
    try {
      await remove.mutateAsync({
        formId: formToDelete.id,
        evolutionCount,
      })
      setFormToDelete(null)
      setEvolutionCount(0)
    } catch {
      /* toast no hook */
    }
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" component="h3">
          Fichas de avaliação
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to={`/patients/${patientId}/evaluation-forms/new`}
          sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
        >
          Adicionar ficha
        </Button>
      </Stack>

      <SupabaseConfigAlert />

      {isLoading ? <ListPageSkeleton /> : null}
      {isError ? (
        <Alert severity="error">{(error as Error).message}</Alert>
      ) : null}
      {!isLoading && !isError && data && data.length === 0 ? (
        <Stack spacing={2}>
          <Typography color="text.secondary">
            Este paciente ainda não tem fichas de avaliação.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            component={Link}
            to={`/patients/${patientId}/evaluation-forms/new`}
            sx={{ alignSelf: 'flex-start' }}
          >
            Adicionar primeira ficha
          </Button>
        </Stack>
      ) : null}
      {!isLoading && !isError && data && data.length > 0 ? (
        <Grid container spacing={2}>
          {data.map((form) => (
            <Grid key={form.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <ListCard
                actions={
                  <>
                    <Tooltip title="Ver ficha">
                      <IconButton
                        component={Link}
                        to={`/patients/${patientId}/evaluation-forms/${form.id}`}
                        size="small"
                        color="primary"
                        aria-label="Ver ficha"
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar ficha">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Eliminar ficha"
                        onClick={() => void openDeleteDialog(form)}
                        disabled={remove.isPending}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                }
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {form.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Data: {formatDate(form.evaluation_date)}
                </Typography>
              </ListCard>
            </Grid>
          ))}
        </Grid>
      ) : null}

      <ConfirmDeleteDialog
        open={Boolean(formToDelete)}
        title="Eliminar ficha?"
        message={
          loadingCount ? (
            'A verificar registos de evolução…'
          ) : evolutionCount > 0 ? (
            <>
              Esta ficha tem <strong>{evolutionCount}</strong> registo
              {evolutionCount !== 1 ? 's' : ''} de evolução. A eliminação remove a
              ficha e os registos associados. Confirma a eliminação de{' '}
              <strong>{formToDelete?.title ?? 'esta ficha'}</strong>?
            </>
          ) : (
            <>
              Esta ação não pode ser anulada. Confirma a eliminação de{' '}
              <strong>{formToDelete?.title ?? 'esta ficha'}</strong>?
            </>
          )
        }
        loading={remove.isPending || loadingCount}
        onCancel={() => {
          setFormToDelete(null)
          setEvolutionCount(0)
        }}
        onConfirm={() => void confirmDelete()}
      />
    </Box>
  )
}
