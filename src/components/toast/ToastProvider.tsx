import { Alert, Snackbar } from '@mui/material'
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { ToastContext } from './toastContext'
import { registerToastHandlers } from './toastBridge'

type SnackbarState = {
  open: boolean
  message: string
  severity: 'success' | 'error'
}

function normalizeError(message: string | Error): string {
  if (typeof message === 'string') return message
  const m = message?.message?.trim()
  return m && m.length > 0 ? m : 'Ocorreu um erro.'
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  const showSuccess = useCallback((message: string) => {
    setState({ open: true, message, severity: 'success' })
  }, [])

  const showError = useCallback((message: string | Error) => {
    setState({
      open: true,
      message: normalizeError(message),
      severity: 'error',
    })
  }, [])

  const value = useMemo(
    () => ({ showSuccess, showError }),
    [showSuccess, showError],
  )

  useLayoutEffect(() => {
    registerToastHandlers({ showSuccess, showError })
    return () => registerToastHandlers(null)
  }, [showSuccess, showError])

  const handleClose = useCallback(
    (_event?: unknown, reason?: string) => {
      if (reason === 'clickaway') return
      setState((s) => ({ ...s, open: false }))
    },
    [],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={5000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClose}
          severity={state.severity}
          variant="filled"
          elevation={6}
          sx={{ width: '100%', alignItems: 'center' }}
        >
          {state.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  )
}
