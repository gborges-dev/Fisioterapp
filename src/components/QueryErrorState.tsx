import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { EmptyState } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import {
  getApiErrorStatus,
  getFriendlyErrorMessage,
  isNotFoundError,
} from '@/lib/apiError'

type QueryErrorStateProps = {
  error: unknown
  title?: string
  description?: string
  onRetry?: () => void
  backTo?: { label: string; href: string }
  action?: ReactNode
}

export function QueryErrorState({
  error,
  title,
  description,
  onRetry,
  backTo,
  action,
}: QueryErrorStateProps) {
  const notFound = isNotFoundError(error)
  const resolvedTitle =
    title ??
    (notFound ? 'Conteúdo não encontrado' : 'Não foi possível carregar')
  const resolvedDescription =
    description ?? getFriendlyErrorMessage(error)

  const defaultAction =
    action ??
    (
      <div className="flex flex-wrap items-center justify-center gap-2">
        {onRetry ? (
          <Button variant="default" onClick={onRetry}>
            Tentar novamente
          </Button>
        ) : null}
        {backTo ? (
          <Button variant="outline" asChild>
            <Link to={backTo.href}>{backTo.label}</Link>
          </Button>
        ) : null}
      </div>
    )

  return (
    <EmptyState
      title={resolvedTitle}
      description={resolvedDescription}
      action={defaultAction}
    />
  )
}

/** Para logs ou telemetria — preserva detalhe técnico sem mostrar ao utilizador. */
export function getQueryErrorStatus(error: unknown): number | null {
  return getApiErrorStatus(error)
}
