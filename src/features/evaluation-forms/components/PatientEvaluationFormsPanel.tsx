import { Eye, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/AppShell'
import { ApiConfigAlert } from '@/components/ApiConfigAlert'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { ListCard } from '@/components/ListCard'
import { ListPageSkeleton } from '@/components/ListPageSkeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-foreground">Fichas de avaliação</h3>
        <Button asChild className="w-full sm:w-auto">
          <Link to={`/patients/${patientId}/evaluation-forms/new`}>
            <Plus className="h-4 w-4" />
            Adicionar ficha
          </Link>
        </Button>
      </div>

      <ApiConfigAlert />

      {isLoading ? <ListPageSkeleton /> : null}
      {isError ? (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      ) : null}
      {!isLoading && !isError && data && data.length === 0 ? (
        <EmptyState
          title="Sem fichas de avaliação"
          description="Este paciente ainda não tem fichas de avaliação."
          action={
            <Button variant="outline" asChild>
              <Link to={`/patients/${patientId}/evaluation-forms/new`}>
                <Plus className="h-4 w-4" />
                Adicionar primeira ficha
              </Link>
            </Button>
          }
        />
      ) : null}
      {!isLoading && !isError && data && data.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data.map((form) => (
            <ListCard
              key={form.id}
              actions={
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        asChild
                        aria-label="Ver ficha"
                      >
                        <Link to={`/patients/${patientId}/evaluation-forms/${form.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ver ficha</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        aria-label="Eliminar ficha"
                        onClick={() => void openDeleteDialog(form)}
                        disabled={remove.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Eliminar ficha</TooltipContent>
                  </Tooltip>
                </>
              }
            >
              <h4 className="font-semibold text-foreground">{form.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Data: {formatDate(form.evaluation_date)}
              </p>
            </ListCard>
          ))}
        </div>
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
    </div>
  )
}
