import { Pencil, Trash2 } from 'lucide-react'

import { QueryErrorState } from '@/components/QueryErrorState'
import { RichTextContent } from '@/components/RichTextContent'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { previewPlainText } from '@/lib/richText'
import { cn } from '@/lib/utils'
import type { EvolutionRow } from '../services/evolutionApi'

export function formatEvolutionDate(iso: string) {
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

export function EvolutionEntriesAccordion({
  entries,
  formTitleById,
  isLoading,
  isError,
  error,
  expandedId,
  editingId,
  onExpandedChange,
  onEdit,
  onDelete,
  deleteDisabled,
}: {
  entries: EvolutionRow[] | undefined
  formTitleById: Map<string, string>
  isLoading: boolean
  isError: boolean
  error: Error | null
  expandedId: string | false
  editingId: string | null
  onExpandedChange: (id: string | false) => void
  onEdit: (row: EvolutionRow) => void
  onDelete: (row: EvolutionRow) => void
  deleteDisabled?: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <QueryErrorState
        error={error}
        title="Não foi possível carregar o histórico"
        description={undefined}
      />
    )
  }

  if (!entries?.length) {
    return (
      <p className="text-sm text-muted-foreground">Sem registos ainda.</p>
    )
  }

  return (
    <Accordion
      type="single"
      collapsible
      value={expandedId || undefined}
      onValueChange={(v) => onExpandedChange(v || false)}
      className="space-y-2"
    >
      {entries.map((row) => {
        const fichaTitle =
          formTitleById.get(row.patient_evaluation_form_id) ?? 'Ficha'
        const isEditing = editingId === row.id
        const preview = previewPlainText(row.content)
        const isExpanded = expandedId === row.id

        return (
          <AccordionItem
            key={row.id}
            value={row.id}
            className={cn(
              'glass-subtle overflow-hidden rounded-xl border border-primary/20',
              isEditing && 'border-primary ring-1 ring-primary',
            )}
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline [&>svg]:self-center">
              <div className="flex w-full min-w-0 items-start gap-2 pr-2">
                <div className="min-w-0 flex-1 text-left">
                  <div className="mb-0.5 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {formatEvolutionDate(row.entry_date)}
                    </span>
                    <span className="text-sm text-muted-foreground">· {fichaTitle}</span>
                    {isEditing ? (
                      <Badge variant="default">A editar</Badge>
                    ) : null}
                  </div>
                  {preview && !isExpanded ? (
                    <p className="truncate text-sm text-muted-foreground">{preview}</p>
                  ) : null}
                </div>
                <div
                  className="flex shrink-0 items-center gap-0.5 self-center"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        aria-label={`Editar registo de ${formatEvolutionDate(row.entry_date)}`}
                        onClick={() => onEdit(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar registo</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        aria-label={`Eliminar registo de ${formatEvolutionDate(row.entry_date)}`}
                        onClick={() => onDelete(row)}
                        disabled={deleteDisabled}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Eliminar registo</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <RichTextContent content={row.content} variant="body2" />
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
