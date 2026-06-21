import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import type { ReactNode } from 'react'

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
    <Dialog open={open} onClose={loading ? undefined : onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {typeof message === 'string' ? (
          <Typography variant="body2">{message}</Typography>
        ) : (
          message
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
