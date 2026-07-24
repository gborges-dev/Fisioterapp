import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function ConfirmDeleteDialog({
  open,
  title,
  message,
  confirmLabel = 'Eliminar',
  loading = false,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && !loading && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {typeof message === 'string' ? (
            <DialogDescription>{message}</DialogDescription>
          ) : (
            <div className="text-sm text-muted-foreground">{message}</div>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
