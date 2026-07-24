import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { ApiConfigAlert } from '@/components/ApiConfigAlert'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { ListPageSkeleton } from '@/components/ListPageSkeleton'
import { RichTextEditor } from '@/components/RichTextEditor'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { isRichTextEmpty } from '@/lib/richText'
import { usePatientEvaluationForms } from '../../evaluation-forms/hooks/usePatientEvaluationForms'
import {
  useCreateEvolution,
  useDeleteEvolutionEntry,
  useEvolutionEntries,
  useUpdateEvolutionEntry,
} from '../hooks/useEvolution'
import type { EvolutionRow } from '../services/evolutionApi'
import {
  EvolutionEntriesAccordion,
  formatEvolutionDate,
} from './EvolutionEntriesAccordion'

type FormMode = 'create' | 'edit'

const emptyForm = () => ({
  content: '',
  entryDate: new Date().toISOString().slice(0, 10),
  evaluationFormId: '',
})

function rowToForm(row: EvolutionRow) {
  return {
    content: row.content,
    entryDate: row.entry_date.slice(0, 10),
    evaluationFormId: row.patient_evaluation_form_id,
  }
}

export function EvolutionPanel({ patientId }: { patientId: string }) {
  const { data, isLoading, isError, error } = useEvolutionEntries(patientId)
  const { data: evaluationForms, isLoading: loadingForms } =
    usePatientEvaluationForms(patientId)
  const create = useCreateEvolution(patientId)
  const update = useUpdateEvolutionEntry(patientId)
  const removeEntry = useDeleteEvolutionEntry(patientId)

  const [mode, setMode] = useState<FormMode>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [entryDate, setEntryDate] = useState(() => emptyForm().entryDate)
  const [evaluationFormId, setEvaluationFormId] = useState('')
  const [expandedId, setExpandedId] = useState<string | false>(false)
  const [entryToDelete, setEntryToDelete] = useState<EvolutionRow | null>(null)

  const formTitleById = useMemo(
    () => new Map((evaluationForms ?? []).map((f) => [f.id, f.title])),
    [evaluationForms],
  )

  const resetForm = () => {
    const empty = emptyForm()
    setMode('create')
    setEditingId(null)
    setContent(empty.content)
    setEntryDate(empty.entryDate)
    setEvaluationFormId(empty.evaluationFormId)
  }

  const startEdit = (row: EvolutionRow) => {
    const values = rowToForm(row)
    setMode('edit')
    setEditingId(row.id)
    setContent(values.content)
    setEntryDate(values.entryDate)
    setEvaluationFormId(values.evaluationFormId)
    setExpandedId(row.id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId || isRichTextEmpty(content) || !evaluationFormId) return

    const payload = {
      content: content.trim(),
      entryDate,
      patientEvaluationFormId: evaluationFormId,
    }

    try {
      if (mode === 'edit' && editingId) {
        const savedId = editingId
        await update.mutateAsync({ entryId: editingId, ...payload })
        resetForm()
        setExpandedId(savedId)
      } else {
        await create.mutateAsync(payload)
        resetForm()
      }
    } catch {
      /* erro na mutation */
    }
  }

  const confirmDeleteEntry = async () => {
    if (!entryToDelete) return
    try {
      await removeEntry.mutateAsync(entryToDelete.id)
      if (editingId === entryToDelete.id) {
        resetForm()
      }
      if (expandedId === entryToDelete.id) {
        setExpandedId(false)
      }
      setEntryToDelete(null)
    } catch {
      /* toast no hook */
    }
  }

  const formsAvailable = (evaluationForms?.length ?? 0) > 0
  const isPending = create.isPending || update.isPending
  const mutationError = create.error ?? update.error
  const submitDisabled =
    isPending ||
    !evaluationFormId ||
    !formsAvailable ||
    isRichTextEmpty(content)

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-foreground">Evolução</h3>
      <ApiConfigAlert />

      {loadingForms ? (
        <ListPageSkeleton count={1} cardHeight={48} />
      ) : null}
      {!loadingForms && evaluationForms && evaluationForms.length === 0 ? (
        <Alert variant="warning" className="mb-4">
          <AlertDescription>
            É necessário adicionar uma ficha de avaliação antes de registar evolução.{' '}
            <Link
              to={`/patients/${patientId}/evaluation-forms/new`}
              className="text-primary underline"
            >
              Adicionar ficha
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <h4 className="mb-3 text-base font-semibold text-foreground">
            {mode === 'edit' ? 'Editar registo' : 'Novo registo'}
          </h4>
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="evaluation-form-select">Ficha de avaliação</Label>
                <Select
                  value={evaluationFormId || undefined}
                  onValueChange={setEvaluationFormId}
                  disabled={!formsAvailable}
                  required
                >
                  <SelectTrigger id="evaluation-form-select">
                    <SelectValue placeholder="Selecionar ficha…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(evaluationForms ?? []).map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.title} ({formatEvolutionDate(f.evaluation_date)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry-date">Data</Label>
                <Input
                  id="entry-date"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                />
              </div>
              <RichTextEditor
                label="Registo de evolução"
                value={content}
                onChange={setContent}
              />
              {mutationError ? (
                <Alert variant="destructive">
                  <AlertDescription>{(mutationError as Error).message}</AlertDescription>
                </Alert>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" disabled={submitDisabled}>
                  {mode === 'edit' ? 'Guardar alterações' : 'Adicionar registo'}
                </Button>
                {mode === 'edit' ? (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar edição
                  </Button>
                ) : null}
              </div>
            </div>
          </form>
        </div>

        <div className="md:col-span-7">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="text-base font-semibold text-foreground">
              Histórico de evolução
            </h4>
            {!isLoading && data ? (
              <span className="text-sm text-muted-foreground">
                {data.length} registo{data.length !== 1 ? 's' : ''}
              </span>
            ) : null}
          </div>
          <div className="md:max-h-[calc(100vh-280px)] md:overflow-y-auto md:pr-1 md:pt-0.5">
            <EvolutionEntriesAccordion
              entries={data}
              formTitleById={formTitleById}
              isLoading={isLoading}
              isError={isError}
              error={error as Error | null}
              expandedId={expandedId}
              editingId={editingId}
              onExpandedChange={setExpandedId}
              onEdit={startEdit}
              onDelete={setEntryToDelete}
              deleteDisabled={removeEntry.isPending}
            />
          </div>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={Boolean(entryToDelete)}
        title="Eliminar registo de evolução?"
        message={
          <>
            Esta ação não pode ser anulada. Confirma a eliminação do registo de{' '}
            <strong>
              {entryToDelete ? formatEvolutionDate(entryToDelete.entry_date) : ''}
            </strong>
            ?
          </>
        }
        loading={removeEntry.isPending}
        onCancel={() => setEntryToDelete(null)}
        onConfirm={() => void confirmDeleteEntry()}
      />
    </div>
  )
}
